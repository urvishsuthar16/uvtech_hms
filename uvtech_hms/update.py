import frappe
from frappe.utils import getdate, nowdate

@frappe.whitelist(allow_guest=True)
def get_latest_support_data():
    latest_record = frappe.db.get_list('HMS Price List', 
        order_by='date desc',  
        limit=1  
    )
    
    if latest_record:
        latest_price_list = frappe.get_doc('HMS Price List', latest_record[0])
        return latest_price_list.name, latest_price_list.items

    else:
        return None
    

@frappe.whitelist(allow_guest=True)
def get_supplier_price(supplier, item_code):
    latest_record = frappe.db.get_list('HMS Price List', 
        fields=['name'],  # Only need 'name' to fetch the document
        order_by='date desc',
        limit=1
    )
    
    if latest_record:
        latest_price_list = frappe.get_doc('HMS Price List', latest_record[0].name)
        items_list = latest_price_list.items
        filtered_items = [item for item in items_list if item.supplier == supplier and item.item_code == item_code]
        
        if filtered_items:
            lowest_price_item = min(filtered_items, key=lambda x: x.price)
            return lowest_price_item
        else:
            return None
    else:
        return None





@frappe.whitelist()
def navigate_to_spl_attendance():
    user = frappe.session.user
    roles = frappe.get_roles(user)
    
    # Check if user has the 'SPL Staff' role
    if 'SPL Staff' in roles:
        frappe.publish_realtime(
                "downstream_api", 
                {
                    "message": "An error occurred while making contracts downstream API call. Please check the error log for details.",
                    "indicator": "red",  # Try specifying an indicator explicitly
                }
            )



@frappe.whitelist()
def get_user_role():
    user_roles = frappe.get_roles(frappe.session.user)
    if "SPL Manager" in user_roles:
        return True
    else:
        return False



@frappe.whitelist()
def get_staff_users():
    users = frappe.db.sql("""
        SELECT DISTINCT u.email, u.full_name
        FROM `tabUser` u
        JOIN `tabHas Role` r ON u.name = r.parent
        WHERE u.enabled = 1
        AND r.role = 'SPL Staff'
    """, as_dict=True)

    return users


@frappe.whitelist()
def check_is_user_assigned(user, project_name):
    # Query the Project User table to check if the user is assigned to any project
    assigned_projects = frappe.db.get_all(
        'Project User',  
        filters={
            'user': user,
            'custom_assiged': 1,
            'parent': ['!=', project_name],  
        },
        fields=['parent'] 
    )

    # Check if the user is already assigned to any other projects
    if assigned_projects:
        return {
            'status': 'assigned',
            'projects': [project['parent'] for project in assigned_projects]
        }
    else:
        return {
            'status': 'not_assigned'
        }




@frappe.whitelist()
def create_employee(self, method):
    todays_date = getdate(nowdate())

    employee_doc = frappe.get_doc({
        "doctype": "Employee",
        "first_name": self.first_name, 
        "employee_name": self.full_name,
        "date_of_joining": todays_date,
        "gender": self.gender,
        "date_of_birth": self.custom_date_of_birth,
        "user_id": self.name,
        "status": "Active"  # You can modify this based on your use case
    })
    
    employee_doc.insert()
    frappe.db.commit()



@frappe.whitelist()
def update_user_doc(self, method):
    if self.role_profile_name in ['SPL Staff', 'SPL Manager'] :
        self.module_profile = 'spl'
        self.new_password = 'uvtech123'