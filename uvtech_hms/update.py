import frappe
from frappe.utils import getdate, nowdate

@frappe.whitelist(allow_guest=True)
def get_latest_support_data():
    # Fetch all HMS Price List records and their items
    all_price_lists = frappe.db.get_list(
        'HMS Price List',
        fields=['name', 'supplier', 'date'],
        order_by='date desc', 
        limit_page_length=0  
    )

    lowest_prices = {}

    for record in all_price_lists:
        # Fetch the full price list document
        doc = frappe.get_doc('HMS Price List', record['name'])

        for item in doc.items:
            item_code = item.item_code
            item_price = item.price
            supplier = doc.supplier
            
            if item_code in lowest_prices:
                # If the new price is lower, update the entry
                if item_price < lowest_prices[item_code]['price']:
                    lowest_prices[item_code] = {
                        'supplier': supplier,
                        'price': item_price
                    }
            else:
                # If the item is not in the dictionary, add it
                lowest_prices[item_code] = {
                    'supplier': supplier,
                    'price': item_price
                }

    return lowest_prices





@frappe.whitelist(allow_guest=True)
def get_supplier_price(supplier, item_code):
    # Fetch the HMS Price List document for the given supplier
    price_list = frappe.get_all('HMS Price List', filters={'supplier': supplier}, fields=['name'])

    if not price_list:
        frappe.throw(f"No price list found for supplier: {supplier}")

    price_list_doc = frappe.get_doc('HMS Price List', price_list[0].name)

    for item in price_list_doc.items:
        if item.item_code == item_code:
            return {
                'item_code': item.item_code,
                'price': item.price
            }

    frappe.throw(f"Item {item_code} not found in the supplier's price list")






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
    latest_holiday_list = 'SPL'
    # Get the latest Holiday List by creation date
    holiday_lists = frappe.get_all("Holiday List", fields=["name"], order_by="creation desc", limit=1)
    if holiday_lists:
        latest_holiday_list = holiday_lists[0].name

    employee_doc = frappe.get_doc({
        "doctype": "Employee",
        "first_name": self.first_name, 
        "employee_name": self.full_name,
        "date_of_joining": todays_date,
        "gender": self.gender,
        "date_of_birth": self.custom_date_of_birth,
        "user_id": self.name,
        "status": "Active",
        "salary_currency": 'AUD',
        "custom_standard_hours": 8,
        "salary_mode": 'Cash',
        "holiday_list": latest_holiday_list 
    })
    
    employee_doc.insert()
    frappe.db.commit()



@frappe.whitelist()
def update_user_doc(self, method):
    if self.role_profile_name in ['SPL Staff', 'SPL Manager'] :
        self.module_profile = 'spl'
        self.new_password = 'uvtech123'