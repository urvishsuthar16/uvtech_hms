# Copyright (c) 2024, gg and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.core.doctype.communication.email import make


class Inventory(Document):
    pass

@frappe.whitelist()
def send_mail(docname, email_template_text):
    # Fetch the Inventory document
    doc = frappe.get_doc("Inventory", docname)
    
    # Initialize the content with the email template text and HTML table structure
    content = f"""
        <p>{email_template_text}</p>  <!-- Add the email template text -->
        <p>Here are the details of the inventory items:</p>
        <table border="1" cellspacing="0" cellpadding="5">
            <thead>
                <tr>
                    <th>Item Code</th>
                    
                    <th>Quantity</th>
                </tr>
            </thead>
            <tbody>
    """
    
    # Loop through the Stock Inventory Item table and append rows to the table
    for item in doc.inventory_items:  # Assuming 'inventory_items' is the child table fieldname
        if item.qty>0:
            content += f"""
                <tr>
                    <td>{item.item_code}</td>
                    
                    <td>{item.qty}</td>
                </tr>
            """
    
    # Close the table
    content += """
            </tbody>
        </table>
    """
    
    # Send the email
    frappe.sendmail(
        recipients=doc.supplier_email,  # Replace with the appropriate recipient
        subject=f"Inventory Update for {doc.name}",
        message=content,
    )
    
    # Return success message
    frappe.msgprint("Email sent successfully.")
