
import frappe
import json
from datetime import date
import datetime
from frappe.utils import getdate, nowdate

def assign_task(user, shift_type, employee_id, project):
    # Get today's date
    todays_date = getdate(nowdate())

    # Get current weekday (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
    current_weekday = datetime.datetime.today().weekday()
    # current_weekday = 0
    # List of project tasks
    project_task_list = frappe.db.get_all(
        'Project Tasks',
        filters={
            'parent': project,
            'assign': 1,
            'shift': shift_type
        },
        fields=['task_id', 'subject', 'type', 'priority', 'shift', 'is_attachments_need']
    )
    for task in project_task_list:
        task_sub = task['subject']
        
        # Check if the task is a daily task
        if task['type'] == 'Daily':
            task_completed_today = frappe.db.exists(
                'Task',
                {
                    'subject': task_sub,
                    'completed_by': user,
                    'exp_start_date': todays_date,
                    'status': 'Completed',
                    'type': 'Daily'
                }
            )
            print(task_completed_today, task_sub, user, todays_date, 'ra,ss')
            # If the task is not completed today, create a new task
            if not task_completed_today:
                create_task_list(task, user, todays_date, shift_type)

        # Check for weekly tasks if today is Monday (current_weekday == 0)
        if current_weekday == 0 and task['type'] == 'Weekly':
            task_completed_this_week = frappe.db.exists(
                'Task',
                {
                    'subject': task_sub,
                    'completed_by': user,
                    'exp_start_date': todays_date,
                    'status': 'Completed',
                    'type': 'Weekly'
                }
            )
            # If the task is not completed this week, create a new task
            if not task_completed_this_week:
                create_task_list(task, user, todays_date, shift_type)


def create_task_list(task,user,todays_date,shift_type):
    new_task = frappe.get_doc({
        'doctype': 'Task',
        'subject': task['subject'],
        'status': 'Open',
        "exp_start_date": todays_date,
        "exp_end_date": todays_date,
        "custom_shift":shift_type,
        'type': task['type'],
        "priority":task["priority"],
        "custom_is_attachments_need": task['is_attachments_need'],
        "is_template": 0
    })
    new_task.insert(ignore_permissions=True)

    todo = frappe.get_doc({
        'doctype': 'ToDo',
        'description': f'Please check the new task: {new_task.subject}',
        'reference_type': 'Task',
        'reference_name': new_task.name,
        "allocated_to" : user,
        "date":todays_date
        # 'owner': user['name']
    })
    todo.insert(ignore_permissions=True)
    return new_task
    
@frappe.whitelist()
def upload_files_and_change_task_status(files,taskId,user=None):
    files=json.loads(files)
    task=frappe.get_doc('Task',taskId)
    task.status='Completed'
    task.completed_on = frappe.utils.getdate()
    task.completed_by = user

    for i in files:
        # frappe.throw(i)
        task.append('custom_images',{'images':i})
    task.save(ignore_permissions=True)

@frappe.whitelist()
def set_total_time(totalHours, totalMinutes):
    try:
        # Convert inputs to integers
        total_hours = int(totalHours)
        total_minutes = int(totalMinutes)

        # Calculate total time in minutes
        total_time_minutes = (total_hours * 60) + total_minutes

        return {'total_time_minutes': total_time_minutes}

    except Exception as e:
        frappe.log_error(message=str(e), title="Error in set_total_time")
        frappe.throw(('Error updating total time: {0}').format(str(e)))
   


@frappe.whitelist(allow_guest=True)
def delete_existing_tasks(employee_id, shift_type, project):
    
    todays_date=frappe.utils.getdate()
    user = frappe.session.user
    task_list = frappe.db.sql("""
        SELECT * FROM `tabTask`
        WHERE owner = %(owner)s 
        AND exp_start_date = %(date)s
        AND status = 'Open' """,({"owner":user,"date":todays_date}),as_dict=1)
    if task_list :
        for task in task_list:
            frappe.delete_doc("Task", task["name"], force=1)
    assign_task(user, shift_type, employee_id, project)

@frappe.whitelist()
def get_all_task_list(user,shift_type,employee_id, project):
    # assign_task(user,shift_type,employee_id)
    todays_date=frappe.utils.getdate()
    today_completed_tasks = frappe.db.sql("""
        SELECT * FROM `tabTask`
        WHERE owner = %(owner)s 
        AND exp_start_date = %(date)s
        AND type IN ('Daily', 'Weekly')
        AND status = 'Completed' """,({"owner":user,"date":todays_date}),as_dict=1)
    open_task_list = frappe.db.sql("""
        SELECT * FROM `tabTask`
        WHERE owner = %(owner)s 
        AND exp_start_date = %(date)s
        AND type IN ('Daily', 'Weekly')
        AND status = 'Open' """,({"owner":user,"date":todays_date}),as_dict=1)
    
    project_tasks = frappe.get_doc("Project", project)
    task_order = [task.subject for task in project_tasks.custom_assign_task]

    ordered_open_task_list = sorted(
        open_task_list,
        key=lambda task: task_order.index(task.get('subject', '')) if task.get('subject') in task_order else len(task_order)
    )

    all_task_list =  ordered_open_task_list + today_completed_tasks

    total_tasks = len(all_task_list)
    total_completed_tasks = len(today_completed_tasks)
    total_pending_tasks = len(ordered_open_task_list)

    # Return the tasks and counts
    return {
        "tasks": all_task_list,
        "total_tasks": total_tasks,
        "total_completed_tasks": total_completed_tasks,
        "total_pending_tasks": total_pending_tasks
    }



@frappe.whitelist()
def update_shift_value(shift, location):
    user = frappe.session.user
    employee = frappe.get_value("Employee", {"user_id": user}, "name")
    
    if employee:
        existing_record = frappe.get_all("Staff temporary data", filters={"employee_id": employee}, limit=1)

        if existing_record:
            doc = frappe.get_doc("Staff temporary data", existing_record[0].name)
            doc.user_id = user
            doc.shift = shift
            doc.location = location
            doc.save()
        else:
            doc = frappe.get_doc({
                "doctype": "Staff temporary data",
                "user_id": user,
                "employee_id": employee,
                "shift": shift,
                "location":location,
            })
            doc.insert()
    else:
        frappe.throw(f"No Employee found for the user: {user}")



@frappe.whitelist()
def get_user_assigned_project():
    user = frappe.session.user
    assigned_project = frappe.db.sql("""
        SELECT parent 
        FROM `tabProject User` 
        WHERE user = %s AND custom_assiged = 1
    """, user, as_dict=True)

    project_list = []
    if assigned_project:
        for item in assigned_project:
            project = frappe.get_value("Project", item['parent'], 'project_name')
            # Append both project ID and name to the list
            project_list.append(project)

    return project_list


# @frappe.whitelist()
# def get_user_assigned_project():
#     user = frappe.session.user
#     location_val = frappe.db.get_value('Staff temporary data', {'user_id': user}, ['location'])
#     return location_val