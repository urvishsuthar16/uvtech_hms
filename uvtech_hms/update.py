import frappe


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
