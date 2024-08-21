import frappe
from datetime import date
from datetime import datetime
from frappe.utils import today, now

# def process_shift_assignment(shift_type, log_message):
#     frappe.log_error("task not",log_message)
#     try:
#         # Get all shift assignments based on the shift_type
#         shifts = frappe.get_all('Shift Assignment',
#             filters={
#                 'shift_type': shift_type,
#                 'docstatus': 1
#             },
#             fields=['employee']
#         )

#         for employee in shifts:
#             # Get employee document
#             emp = frappe.get_doc('Employee', employee['employee'])
            
#             # Get the ToDo document for the employee
#             todos = frappe.get_all('ToDo',
#                 filters={
#                     'reference_type': 'Project',
#                     'date': frappe.utils.getdate(),
#                     'status': 'Open',
#                     'allocated_to': emp.company_email
#                 },
#                 fields=['name', 'reference_name']
#             )
            
#             # Process each todo
#             for todo in todos:
#                 receiver = ['01saloniradhvi@gmail.com']
#                 receiver.append(emp.company_email)

#                 # Get the associated project document
#                 project = frappe.get_doc('Project', todo['reference_name'])
                
#                 # Fetch related tasks
#                 project_tasks = frappe.get_all('Task',
#                     filters={
#                         'project': project.name,
#                         'status': 'Open'
#                     },
#                     fields=['name', 'subject', 'status']
#                 )

#                 # Prepare the list of incomplete tasks
#                 if project_tasks:
#                     incomplete_tasks = [task['name'] for task in project_tasks]
                    
#                     # Send email with incomplete tasks
#                     if incomplete_tasks:
#                         frappe.sendmail(
#                             recipients=receiver,
#                             message=f"Incomplete tasks: {', '.join(incomplete_tasks)}",
#                             subject="Task Not Completed"
#                         )

#     except Exception as e:
#         frappe.log_error(frappe.get_traceback(), f"{shift_type.capitalize()} Shift Assignment Error")


# def get_morning_shift_assignment():
#     process_shift_assignment('Morning', "Run at 3 PM")

# def get_evening_shift_assignment():
#     process_shift_assignment('Evening', "Run at 11 PM")

def remove_default_shift():
    all_employees = frappe.db.get_all('Employee')
    for emp in all_employees:
        frappe.db.set_value('Employee',emp,'default_shift','')

def test_time():
    morning_shift = frappe.db.get_value('Shift Type','Morning','end_time')

    morning_shift_end = datetime.combine(datetime.now(),datetime.min.time()) + morning_shift

    evening_shift = frappe.frappe.db.get_value('Shift Type','Evening','end_time')
    evening_shift_end = datetime.combine(datetime.now(),datetime.min.time()) + evening_shift
    send_email_for_task('Evening')
    if frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),morning_shift_end) >= 1 and frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),morning_shift_end) < 2:
        send_email_for_task('Morning')

    elif frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),evening_shift_end) >= 1 and frappe.utils.time_diff_in_hours(frappe.utils.nowtime(),evening_shift_end) < 2:
        send_email_for_task('Evening')

def send_email_for_task(shift_type):
    raw_email_list = frappe.db.sql(""" SELECT DISTINCT u.name 
                        FROM `tabUser` u LEFT JOIN `tabHas Role` hr ON hr.parent = u.name 
                        WHERE hr.role=%s """, ("SPL Manager",),as_dict=1)
    
    pending_task = frappe.db.sql("""SELECT name,subject, project ,exp_end_date,owner
                    FROM  `tabTask` WHERE custom_shift = %(shift)s
                    AND  exp_end_date = %(today)s
                    AND status NOT IN ('Completed','Template') 
                    """,({'shift':shift_type,'today':datetime.now()}),as_dict=1)

    content = "<table class='table table-bordered'>"
    content += "<thead><tr><th>Task ID</th><th>Date</th><th>Subject</th><th>Project</th></tr></thead><tbody>"
    
    # Iterate through the pending tasks and add rows to the table
    for task in pending_task:
        content += f"<tr><td>{task['name']}</td><td>{task['exp_end_date']}</td><td>{task['subject']}</td><td>{task['project']}</td></tr>"
    
    # Close the table tags
    content += "</tbody></table>"
    email_list = [email.name for email in raw_email_list]
        
    frappe.sendmail(
        recipients='asdad@sdasd.com',
        cc=email_list,
        subject= f"Your Task not completed Yet",
        expose_recipients= 'header',
        message=content,

        )
