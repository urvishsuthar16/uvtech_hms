import frappe
from datetime import date
from datetime import datetime
from frappe.utils import today, now

def remove_default_shift():
    all_employees = frappe.db.get_all('Employee')
    for emp in all_employees:
        frappe.db.set_value('Employee',emp,'default_shift','')

def test_time():
    morning_shift = frappe.db.get_value('Shift Type','Morning','end_time')

    morning_shift_end = datetime.combine(datetime.now(),datetime.min.time()) + morning_shift

    evening_shift = frappe.db.get_value('Shift Type','Evening','end_time')
    evening_shift_end = datetime.combine(datetime.now(),datetime.min.time()) + evening_shift

    if frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),morning_shift_end) >= 1 and frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),morning_shift_end) < 2:
        send_email_for_task('Morning')

    elif frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),evening_shift_end) >= 1 and frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),evening_shift_end) < 2:
        send_email_for_task('Evening')

def send_email_for_task(shift_type):
    # Fetch the list of users with the role 'SPL Manager'
    raw_email_list = frappe.db.sql("""
        SELECT DISTINCT u.name 
        FROM `tabUser` u 
        LEFT JOIN `tabHas Role` hr ON hr.parent = u.name 
        WHERE hr.role = %s
    """, ("SPL Manager",), as_dict=1)
    
    # Fetch pending tasks for the specified shift type and end date
    pending_task = frappe.db.sql("""
        SELECT name, subject, exp_end_date, owner
        FROM `tabTask` 
        WHERE custom_shift = %(shift)s
        AND exp_end_date = %(today)s
        AND status NOT IN ('Completed', 'Template')
    """, {'shift': shift_type, 'today': frappe.utils.nowdate()}, as_dict=1)
    
    # Group tasks by user
    user_task_group = {}
    for row in pending_task:
        if row['owner'] not in user_task_group:
            user_task_group[row['owner']] = []
        user_task_group[row['owner']].append(row)

    # Extract the email list from raw_email_list
    email_list = [email['name'] for email in raw_email_list]
    
    # Send email to each user with their grouped tasks
    for owner, tasks in user_task_group.items():
        project_name = get_user_assigned_project(owner)

        # Prepare the content for the email
        content = f"<p>From the project <strong>{project_name}</strong>, you have the following pending tasks:</p>"

        content += "<table class='table table-bordered'>"
        content += "<thead><tr><th>Task ID</th><th>Date</th><th>Subject</th></tr></thead><tbody>"

        # Iterate through the user's tasks and add rows to the table
        for task in tasks:
            content += f"<tr><td>{task['name']}</td><td>{task['exp_end_date']}</td><td>{task['subject']}</td></tr>"

        # Close the table tags
        content += "</tbody></table>"
        # Send the email to the owner
        frappe.sendmail(
            recipients=owner,
            cc=email_list,
            subject=f"{project_name}-{shift_type}-Pending Tasks",
            expose_recipients='header',
            message=content
        )

@frappe.whitelist()
def task_priority(doc,method=None):
    if doc.priority == 'Urgent':
        doc.custom_priority_no = 0
    elif doc.priority == 'High':
        doc.custom_priority_no = 1
    elif doc.priority == 'Medium':
        doc.custom_priority_no = 2
    elif doc.priority == 'Low':
        doc.custom_priority_no = 3


def get_user_assigned_project(user):
    
    assigned_project = frappe.db.sql("""
        SELECT parent 
        FROM `tabProject User` 
        WHERE user = %s AND custom_assiged = 1
    """, user, as_dict=True)

    if assigned_project:
        # Fetch project details based on parent (which refers to the Project doctype)
        project_name = assigned_project[0].parent
        project = frappe.get_doc("Project", project_name)
        return project.project_name
            
    else:
        return ''