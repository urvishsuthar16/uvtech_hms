// Copyright (c) 2024, gg and contributors
// For license information, please see license.txt

frappe.ui.form.on("Inventory", {
    onload_post_render(frm) {
		frappe.db.get_list('Item', {
            filters: {
                'disabled':0
            }
        }).then(records => {
            for (let item of records){
            console.log(item.name)
                let row = frm.add_child('inventory_items', {
                        item_code: item.name,
                        qty: 0
                    });
                    
                    frm.refresh_field('inventory_items');

            }
        })

	},
    refresh(frm) {
        // Add a custom button on the form
        if (frappe.user_roles.includes("Stock Manager") && !frm.is_new()) {

            frm.add_custom_button(__('Send Mail'), function () {
                // Trigger the send_mail function when the button is clicked
                frappe.call({
                    method: "uvtech_hms.hms.doctype.inventory.inventory.send_mail",
                    args: {
                        docname: frm.doc.name,
                        supplier: frm.doc.supplier,

                        email_template_text: frm.doc.email_template_text
                    },
                    callback: function (response) {
                        if (!response.exc) {
                            frappe.msgprint(__('Email Sent Successfully'));
                        }
                    }
                });
            });
        }
    },
});

