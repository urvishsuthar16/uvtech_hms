// Copyright (c) 2024, gg and contributors
// For license information, please see license.txt

frappe.ui.form.on("Inventory", {
    refresh(frm) {
        // Add a custom button on the form
        frm.add_custom_button(__('Send Mail'), function() {
            // Trigger the send_mail function when the button is clicked
            frappe.call({
                method: "uvtech_hms.hms.doctype.inventory.inventory.send_mail",
                args: {
                    docname: frm.doc.name ,
                    supplier : frm.doc.supplier,
                   
                    email_template_text :frm.doc.email_template_text
                    
                    
                },
                callback: function(response) {
                    if (!response.exc) {
                        frappe.msgprint(__('Email Sent Successfully'));
                    }
                }
            });
        });
    },
});

