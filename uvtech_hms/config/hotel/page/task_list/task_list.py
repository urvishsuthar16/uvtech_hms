import frappe
import json

@frappe.whitelist()
def assign_and_get_task(user,employee_id,shift_type):
    # frappe.throw(shift_type)
    #create project and assign
    project_name=f"{employee_id}/{frappe.utils.getdate()}"
    todays_date=frappe.utils.getdate()
    # frappe.set_user('Administrator')
    exists_pro=frappe.db.exists('Project',{'project_name':project_name})
    if not exists_pro:
        project=frappe.new_doc('Project')
        project.project_name=project_name
        project.project_template="Main Task Template"
        project.expected_start_date=todays_date
        project.expected_end_date=todays_date
        project.project_type='Internal'
        project.custom_shift_type = shift_type
        project.insert(ignore_permissions=True)
       

        #assign and share project
        todo = frappe.new_doc('ToDo')
        todo.allocated_to =user
        todo.reference_type = "Project"
        todo.reference_name = project.name
        todo.description = "Assign"
        todo.insert(ignore_permissions=True)
        
        share = frappe.new_doc('DocShare')
        share.user =user
        share.share_doctype = "Project"
        share.share_name = project.name
        share.read = 1
        share.write=1
        share.insert(ignore_permissions=True)
    # frappe.set_user(user)
    # render all todays tasks
    todos = frappe.get_all('ToDo',
        filters={
            'reference_type': 'Project',
            'allocated_to': user,
            'date': frappe.utils.getdate()
        },
        fields=['name', 'reference_name']
    )
    for i in todos:
        if i:
            project=frappe.get_doc('Project',i['reference_name'])
            # Fetch related tasks
            project_tasks = frappe.get_all('Task',
                filters={
                    'project': project.name,
                    'status': 'Open'
                },
                fields=['name', 'subject', 'status']
            )

        
    
    return project_tasks
    

@frappe.whitelist()
def upload_files_and_change_task_status(files,taskId):
    files=json.loads(files)
    task=frappe.get_doc('Task',taskId)
    task.status='Completed'
    for i in files:
        task.append('custom_images',{'image':i})
    task.save()
    frappe.msgprint("Task has successfully completed")