
frappe.ui.form.on("Inventory", {
    onload_post_render(frm) {
        if (frm.is_new()) {

            frappe.db.get_list('Item', {
                filters: {
                    'disabled': 0
                }
            }).then(records => {
                for (let item of records) {
                    
                    let row = frm.add_child('inventory_items', {
                        item_code: item.name,
                        qty: 0
                    });

                    frm.refresh_field('inventory_items');

                }
            })
        }

    },
    refresh(frm) {
        
        if (frappe.user_roles.includes("SPL Manager") && !frm.is_new()) {

            frm.add_custom_button(__('Send Mail'), function () {
                frappe.call({
                    method: "uvtech_hms.hms.doctype.inventory.inventory.send_mail",
                    args: {
                        docname: frm.doc.name,
                        
                    },
                    callback: function (response) {
                        if (!response.exc) {
                            frappe.msgprint(__('Email Sent Successfully'));
                        }
                    }
                });
            });

            frm.add_custom_button(__('Copy'), function () {
                // Step 1: Select the 'grid-heading-row with-filter' element
                let filterRow = document.querySelector('.grid-heading-row.with-filter');

                if (!filterRow) {
                    console.error("Filter row not found.");
                    return;
                }

                let filterInputs = filterRow.querySelectorAll('.filter-row .search input');

                let item_code_input = filterInputs[1]; // Assuming 1st input is checkbox, 2nd is item_code
                let qty_input = filterInputs[2];       // 3rd input is qty
                let supplier_input = filterInputs[3];   // 4th input is supplier
                let custom_price_input = filterInputs[4]; // 5th input is custom_price

                // Step 4: Check if the elements exist
                if (!item_code_input || !qty_input || !supplier_input || !custom_price_input) {
                    console.error("One or more filter elements could not be found.");
                    return;
                }
                let item_code_filter = item_code_input.value;
                let qty_filter = qty_input.value;
                let supplier_filter = supplier_input.value;
                let custom_price_filter = custom_price_input.value;

                let filtered_items = frm.doc.inventory_items.filter(item => {
                    // Ensure that item fields exist, otherwise default to an empty string or 0 for comparison
                    let item_code = item.item_code || '';
                    let qty = item.qty || 0;
                    let supplier = item.supplier || '';
                    let custom_price = item.price || 0;

                    return (!item_code_filter || item_code.toLowerCase().includes(item_code_filter.toLowerCase())) &&
                            (!qty_filter || qty == parseFloat(qty_filter)) &&
                            (!supplier_filter || supplier.toLowerCase().includes(supplier_filter.toLowerCase())) &&
                            (!custom_price_filter || custom_price == parseFloat(custom_price_filter));

                });

                
                copyDataAndShowMessage(filtered_items);
            });

            frm.add_custom_button(__('Assign Supplier'), function () {
                frappe.call({
                    method: 'uvtech_hms.update.get_latest_support_data',
                    callback: function (r) {
                        if (r.message) {
                            // Assume r.message is an array where first item is doc_name and second is items
                            get_price_list(r.message[0], r.message[1], frm);
                        } else {
                            frappe.msgprint(__('No latest HMS Price List found.'));
                        }
                    }
                });
            });
        }
    },
});


function get_price_list(doc_name, items, frm) {

    frm.set_value('hms_price_list', doc_name)
    // Loop through the existing and newly added records in the child table
    frm.doc.inventory_items.forEach(function (item) {
        if (item.qty > 0) {
            var matchingItems = items.filter(function (record) {
                return record.item_code === item.item_code;
            });

            if (matchingItems.length > 0) {
                var lowestPriceItem = matchingItems.reduce(function (prev, curr) {
                    return (prev.price < curr.price) ? prev : curr;
                }, { price: Infinity });

                if (lowestPriceItem.price !== Infinity) {
                    frappe.model.set_value(item.doctype, item.name, 'price', lowestPriceItem.price);
                    frappe.model.set_value(item.doctype, item.name, 'supplier', lowestPriceItem.supplier);
                }
            }
        }

    });

    frm.refresh_field('inventory_items');
}




frappe.ui.form.on('Stock Inventory items', {

    supplier: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.qty) {
            frappe.call({
                method: 'uvtech_hms.update.get_supplier_price',
                args: {
                    supplier: row.supplier,
                    item_code: row.item_code
                },
                callback: function (r) {
                    if (r.message) {
                        frappe.model.set_value(cdt, cdn, 'price', r.message.price);
                    }
                }
            });
        }

    },
    qty: function (frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.supplier) {
            frappe.call({
                method: 'uvtech_hms.update.get_supplier_price',
                args: {
                    supplier: row.supplier,
                    item_code: row.item_code
                },
                callback: function (r) {
                    if (r.message) {

                        frappe.model.set_value(cdt, cdn, 'price', r.message.price);

                    }
                }
            });
        }
    }
})



function make_supplier_input_field_to_select_filed(frm) {
    let filterRow = document.querySelector('.grid-heading-row.with-filter');

    if (!filterRow) {
        console.error("Filter row not found.");
        return;
    }

    // Step 2: Find the filter inputs inside this 'grid-heading-row with-filter'
    let filterInputs = filterRow.querySelectorAll('.filter-row .search input');

    let supplier_input = filterInputs[3]; // Assuming supplier input is at index 3

    if (!supplier_input) {
        console.error("Supplier input field not found.");
        return;
    }

    let supplier_select = document.createElement('select');
    supplier_select.className = supplier_input.className; // Copy the same class as the input for consistency

    console.log(frm.doc.inventory_items);
    let supplierNames = new Set(); // Using Set to keep unique supplier names

    // Loop through each item in inventory_items
    frm.doc.inventory_items.forEach(item => {
        if (item.supplier) {
            supplierNames.add(item.supplier); // Add supplier to Set
        }
    });

    // Convert Set to array and sort if needed
    let suppliers = Array.from(supplierNames).sort();

    let default_option = document.createElement('option');
    default_option.value = ''; // Empty value for default
    default_option.textContent = 'Select Supplier'; // Placeholder text
    supplier_select.appendChild(default_option);

    // Add options for each supplier
    suppliers.forEach(supplier => {
        let option = document.createElement('option');
        option.value = supplier;
        option.textContent = supplier;
        supplier_select.appendChild(option);
    });

    // Replace the input with the select in the DOM
    supplier_input.parentNode.replaceChild(supplier_select, supplier_input);

    // Add event listener to handle changes
    supplier_select.addEventListener('change', function() {
        let selectedValue = this.value;
        // Update the hidden input with the selected value
        supplier_input.value = selectedValue;
        // Trigger a change event on the hidden input
        let event = new Event('change', { bubbles: true });
        supplier_input.dispatchEvent(event);
    });
}

function copyDataAndShowMessage(data) {
  
    let dataString = '';
    data.forEach(item => {
        dataString += `Item code: ${item.item_code}\nQty: ${item.qty}\nPrice: ${item.price}\n\n`;
    });

    // Copy the dataString to clipboard
    const tempElem = document.createElement('textarea');
    tempElem.value = dataString;  // Use newline characters for better formatting
    document.body.appendChild(tempElem);
    tempElem.select();
    document.execCommand('copy');
    document.body.removeChild(tempElem);

    frappe.show_alert('Data copied to clipboard successfully!', 5);  // Alert displayed for 5 seconds

}
