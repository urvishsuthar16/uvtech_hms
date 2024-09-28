// Copyright (c) 2024, gg and contributors
// For license information, please see license.txt

frappe.query_reports["Attendance"] = {
	"filters": [
        {
            "fieldname": "employee",
            "label": __("Employee"),
            "fieldtype": "Link",
            "options": "Employee",
            "reqd": 1,  // Required filter
        },
        {
            "fieldname": "start_date",
            "label": __("Start Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.add_days(frappe.datetime.nowdate(), -7),
            "reqd": 1,  // Required filter
        },
        {
            "fieldname": "end_date",
            "label": __("End Date"),
            "fieldtype": "Date",
            "default": frappe.datetime.nowdate(),
            "reqd": 1,  // Required filter
        }
    ]
};
