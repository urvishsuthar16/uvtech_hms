import frappe

def get_context(context):
   
    user = frappe.session.user
    
    roles = frappe.get_roles(user)
    
    context.is_spl_staff = 'SPL Staff' in roles
    context.is_spl_manager = 'SPL Manager' in roles
