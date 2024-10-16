# Copyright (c) 2024, gg and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.core.doctype.communication.email import make


class Inventory(Document):
    def before_insert(self):
        user_name = frappe.get_value('User', frappe.session.user, "full_name")
        self.user = user_name
        has_valid_qty = any(item.current_qty and item.current_qty > 0 for item in self.get("inventory_items"))
        if not has_valid_qty:
            frappe.throw("At least one inventory item must have a quantity.")


@frappe.whitelist()
def send_mail(docname):
    # Fetch the Inventory document
    doc = frappe.get_doc("Inventory", docname)
    items_data = doc.inventory_items
    supplier_list = set()

    for each_row in items_data:
        if each_row.supplier:
            supplier_list.add(each_row.supplier)

    supplier_list = list(supplier_list)

    for supplier in supplier_list:
        supplier_records = []
        
        for each_row in items_data:
            if each_row.supplier == supplier:
                supplier_records.append(each_row.as_dict())
        supplier_email_id =frappe.get_value("Supplier", supplier, "email_id")
        
        if supplier_email_id :
            email_format(supplier, supplier_records, supplier_email_id, doc.email_template_text)

    frappe.msgprint("Email sent successfully.")






def email_format(supplier, items_list, supplier_email_id, email_templete):

    email_content = email_templete.replace('{{suppler_name}}', supplier)
    
    content = f"""
        <p></p>
        {email_content}
        <table border="1" cellspacing="0" cellpadding="5">
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
    """
    
    for item in items_list: 
        if item.qty>0:
            content += f"""
                <tr>
                    <td>{item.item_code}</td>
                    
                    <td>{item.qty}</td>
                     <td>{item.price}</td>
                </tr>
            """
    
    # Close the table
    content += """
            </tbody>
        </table>
    """
    # Send the email
    frappe.sendmail(
        recipients=supplier_email_id,
        subject=f"Inventory Update for {supplier}",
        message=content,
    )
    
    # Return success message
    
