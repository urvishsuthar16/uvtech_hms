import frappe
import json

@frappe.whitelist()
def assign_and_get_task(user,shift_type,employee_id):
    task_list = []

    todays_date=frappe.utils.getdate()

    project_task_list = frappe.db.sql("""SELECT t.name,t.subject FROM `tabProject` p 
                    LEFT JOIN `tabProject User` u ON p.name = u.parent
                    LEFT JOIN `tabTask` t ON p.name = t.project
                    WHERE u.email = %(email)s
                    AND t.type = 'Daily'
                    AND  t.is_template = 1 """,({"email":user}),as_dict=1) 
    
    task_list = frappe.db.sql("""
        SELECT * FROM `tabTask`
        WHERE exp_start_date = %(date)s
        AND  owner = %(owner)s
        AND custom_shift = %(shift)s
        AND type = 'Daily'
        AND status = 'Open' """,({"shift":shift_type,"owner":user,"date":todays_date}),as_dict=1)
    
    task_list_completed = frappe.db.sql("""
        SELECT * FROM `tabTask`
        WHERE exp_start_date = %(date)s
        AND  owner = %(owner)s
        AND custom_shift = %(shift)s
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
                new_task = frappe.get_doc({
                    'doctype': 'Task',
                    'subject': task['subject'],
                    'status': 'Open',
                    "exp_start_date": todays_date,
                    "exp_end_date": todays_date,
                    "custom_shift":shift_type,
                    "type":"Daily"
                })
                
                new_task.insert()
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
        # frappe.db.set_value('Employee',employee_id,"default_shift","")
    return task_list   

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
        




