// Copyright (c) 2024, gg and contributors
// For license information, please see license.txt

frappe.ui.form.on("HMS Price List", {
    supplier(frm) {
        if (frm.doc.supplier) {
            // Call the backend to check if the supplier already exists in HMS Price List
            frappe.call({
                method: "frappe.client.get_list",
                args: {
                    doctype: "HMS Price List",
                    filters: {
                        supplier: frm.doc.supplier
                    },
                    fields: ["name"]
                },
                callback: function(r) {
                    if (r.message && r.message.length > 0) {
                        // If supplier exists, show a pop-up message with a link to the existing record
                        let price_list_name = r.message[0].name;
                        frappe.msgprint({
                            title: __('Warning'),
                            message: __('{0} Price List already Created. If you want, you can edit it <a href="/app/hms-price-list/{1}">here</a>.', [frm.doc.supplier, price_list_name]),
                            indicator: 'orange'
                        });
                        
                    }
                }
            });
        }
    }
});
