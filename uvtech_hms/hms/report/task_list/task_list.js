// Copyright (c) 2024, gg and contributors
// For license information, please see license.txt

frappe.query_reports["Task List"] = {
	"filters": [
        {
            "fieldname": "user",
            "label": __("User"),
            "fieldtype": "Link",
            "options": "User",
            "reqd": 1,  // Required filter
        },
        {
            "fieldname": "start_date",
            "label": __("Start Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.nowdate(),
            "reqd": 1,  // Required filter
        },
        {
            "fieldname": "end_date",
            "label": __("End Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.nowdate(),
            "reqd": 1,  // Required filter
        },
        {
            "fieldname": "status",
            "label": __("Status"),
            "fieldtype": "Select",
            "options": "\nOpen\nWorking\nPending Review\nCompleted\nOverdue\nCancelled\nTemplate",
            "default":"Completed",
            "reqd": 1,  // Optional filter
        }
    ]
};
