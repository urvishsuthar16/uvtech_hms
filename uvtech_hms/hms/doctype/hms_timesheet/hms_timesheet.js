frappe.ui.form.on('Hms Timesheet', {
    refresh(frm) {
        console.log("Setting up triggers to calculate and update amount and total hours based on hours and standard_rate in the child table...");

        function update_qty(row) {
            let hours = row.hours;
            let standard_rate = row.standard_rate;
            
            // Calculate the new amount for each row
            let amount = hours * standard_rate;
            
            // Round amount to 2 decimal places
            let newQty = Number(amount.toFixed(2));
            
            // Update the 'amount' field in the current row of 'timesheet_table'
            frappe.model.set_value(row.doctype, row.name, 'amount', newQty);

            // console.log(`New amount calculated and updated for row ${row.idx}:`, newQty);

            // Update the total amount and total hours after recalculating
            
            
        

        
            // let total_amount = 0;
            // let total_hours = 0;
            
            // // Iterate through each row in the 'timesheet_table' and sum the 'amount' and 'hours'
            // frm.doc.timesheet_table.forEach(row => {
            //     total_amount += row.amount || 0;
            //     total_hours += row.hours || 0;
            // });
            // frm.set_value('total_time', total_amount.toFixed(2));
            // frm.set_value('total_hours', total_hours.toFixed(2));
            
            // Set the total amount and total hours in the parent doctype
            // frm.set_value('total_time', total_amount.toFixed(2));
            // frm.set_value('total_hours', total_hours.toFixed(2));
            
            
            
            
            
        
        }
        // Iterate through each row in the 'timesheet_table' and attach the trigger
        frm.doc.timesheet_table.forEach(timesheet_table => {
            // Trigger on 'standard_rate' change
            frappe.ui.form.on(timesheet_table.doctype, 'standard_rate', (frm, cdt, cdn) => {
                let row = locals[cdt][cdn];
                // console.log(total_amount.toFixed(2))
                update_qty(row);
                // console.log(total_amount.toFixed(2))
                
                // frm.save();
            });

            // Trigger on 'hours' change
            frappe.ui.form.on(timesheet_table.doctype, 'hours', (frm, cdt, cdn) => {
                let row = locals[cdt][cdn];
                update_qty(row);
                frm.save();
            });
        });
    },
   
});
 