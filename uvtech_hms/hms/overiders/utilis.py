import frappe

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

# def remove_default_shift():
#     all_employees = frappe.db.get_all('Employee',)