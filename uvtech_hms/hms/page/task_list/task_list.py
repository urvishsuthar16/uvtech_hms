import frappe
import json
from datetime import date
from datetime import datetime


@frappe.whitelist()
def assign_and_get_task(user,shift_type,employee_id):
    task_list = []

    todays_date=frappe.utils.getdate()

    project_task_list = frappe.db.sql("""SELECT t.name,t.subject,t.project,t.type,t.priority,t.custom_priority_no FROM `tabProject` p 
                    LEFT JOIN `tabProject User` u ON p.name = u.parent
                    LEFT JOIN `tabTask` t ON p.name = t.project
                    WHERE u.email = %(email)s
                    AND t.custom_shift = %(shift)s
                    AND  t.is_template = 1 """,({"email":user,"shift":shift_type}),as_dict=1) 
    
    task_list = frappe.db.sql("""
        SELECT * FROM `tabTask`
        WHERE owner = %(owner)s 
        AND custom_shift = %(shift)s
        AND exp_start_date = %(date)s
        AND type = 'Daily'
        AND status = 'Open' """,({"shift":shift_type,"owner":user,"date":todays_date}),as_dict=1)
    
    task_list_completed = frappe.db.sql("""
        SELECT * FROM `tabTask`
        WHERE owner = %(owner)s 
        AND custom_shift = %(shift)s
        AND exp_start_date = %(date)s
        AND type = 'Daily'
        AND status = 'Completed' """,({"shift":shift_type,"owner":user,"date":todays_date}),as_dict=1)
    
    if not task_list and not task_list_completed:
        frappe.db.set_value('Employee',employee_id,"default_shift","")

    if not task_list:
        if  task_list_completed and shift_type:
            frappe.db.set_value('Employee',employee_id,"default_shift","")
        else:
            frappe.db.set_value('Employee',employee_id,"default_shift",shift_type)

            for task in project_task_list:
                # condit = task.type == 'Daily' and not "Monday" == todays_date.strftime("%A")
                if task.type == 'Daily' and not "Monday" == todays_date.strftime("%A"):
                    new_task = frappe.get_doc({
                        'doctype': 'Task',
                        'subject': task['subject'],
                        'status': 'Open',
                        "exp_start_date": todays_date,
                        "exp_end_date": todays_date,
                        "custom_shift":shift_type,
                        "type":task['type'],
                        "priority":task["priority"],
                        "project":task['project'],
                    })
                    new_task.insert(ignore_permissions=True)

                    task_list.append(new_task)

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
                
                elif "Monday" == todays_date.strftime("%A"):
                    new_task = frappe.get_doc({
                        'doctype': 'Task',
                        'subject': task['subject'],
                        'status': 'Open',
                        "exp_start_date": todays_date,
                        "exp_end_date": todays_date,
                        "custom_shift":shift_type,
                        "type":task['type'],
                        "priority":task["priority"],
                        "project":task['project']
                    })
                    new_task.insert(ignore_permissions=True)
                    
                    task_list.append(new_task)

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

    return task_list  
 
def create_task_list(task,user,todays_date,shift_type):

    new_task = frappe.get_doc({
        'doctype': 'Task',
        'subject': task['subject'],
        'status': 'Open',
        "exp_start_date": todays_date,
        "exp_end_date": todays_date,
        "custom_shift":shift_type,
        "type":"Daily",
        "priority":task["priority"],
        "project":task['project']
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

        # Optionally, you might want to perform more actions, like updating a database record
        # For example, updating a specific document field:
        # doc = frappe.get_doc('Your Doctype', 'your_doc_name')
        # doc.total_time_minutes = total_time_minutes
        # doc.save()
        
        # Return the calculated total time in minutes
        return {'total_time_minutes': total_time_minutes}

    except Exception as e:
        frappe.log_error(message=str(e), title="Error in set_total_time")
        frappe.throw(('Error updating total time: {0}').format(str(e)))
   
    

    
   