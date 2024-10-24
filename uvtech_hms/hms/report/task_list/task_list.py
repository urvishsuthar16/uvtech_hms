import frappe
from frappe.utils import getdate, add_days

def execute(filters=None):
    # Access filter values
    user = filters.get("user")
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")
    status = filters.get("status", "Completed")  # Default to "Completed" status if no status is provided
    shift = filters.get("shift")

    # Ensure date filters are valid
    if start_date:
        start_date = getdate(start_date)
    
    if end_date:
        end_date = getdate(end_date)
        # Adjust the end date to include one more day to capture tasks on the end_date
        end_date = add_days(end_date, 1)

    # If no user is selected, return tasks for all users.
    user_condition = ""
    if user:
        user_condition = "AND (t.completed_by = %(user)s OR t.owner = %(user)s)"
    
    # Construct the shift condition to filter by shift or show all shifts
    shift_condition = ""
    if shift:
        shift_condition = "AND t.custom_shift = %(shift)s"

    # Construct the SQL query using filter values
    query = f"""
        SELECT 
            t.name AS `Task ID`,
            t.subject AS `Task Name`,
            t.type AS `Task Type`,
            t.priority AS `Priority`,
            t.custom_shift AS `Shift`,
            u.full_name AS `Completed By`,
            t.custom_is_attachments_need AS `Is Attachments Need`,
            t.status AS `Status`,
            SUBSTRING_INDEX(GROUP_CONCAT(ci.images), ',', 1) AS `Attachment`,
            t.creation AS `Last Updated`,
            t.modified AS `Completed Date`
        FROM 
            `tabTask` t
        LEFT JOIN 
            `tabImages` ci ON ci.parent = t.name
        LEFT JOIN 
            `tabUser` u ON u.name = t.completed_by
        WHERE 
            t.status = %(status)s
            AND t.creation BETWEEN %(start_date)s AND %(end_date)s
            {shift_condition}
            {user_condition}
        GROUP BY 
            t.name
        ORDER BY 
            t.modified DESC  
    """

    # Execute the SQL query with filters
    data = frappe.db.sql(query, {
        'user': user,
        'start_date': start_date,
        'end_date': end_date,
        'status': status,
        'shift': shift
    }, as_dict=True)

    # Prepare data to display image
    for row in data:
        if row["Attachment"]:  # Check if there is an attachment
            row["Attachment"] = f'<a href="{frappe.utils.get_url(row["Attachment"])}" target="_blank">View Image</a>'
        else:
            row["Attachment"] = ""

    # Define the columns to be displayed in the report
    columns = [
        {"fieldname": "Task ID", "label": "Task ID", "fieldtype": "Data"},
        {"fieldname": "Last Updated", "label": "Task Date", "fieldtype": "Datetime"},  
        {"fieldname": "Completed Date", "label": "Completed Date", "fieldtype": "Datetime"}, 
        {"fieldname": "Task Name", "label": "Task Name", "fieldtype": "Data"},
        {"fieldname": "Task Type", "label": "Task Type", "fieldtype": "Data"},
        {"fieldname": "Priority", "label": "Priority", "fieldtype": "Select", "options": "\n".join(["Low", "Medium", "High"])},
        {"fieldname": "Shift", "label": "Shift", "fieldtype": "Data"},
        {"fieldname": "Completed By", "label": "Completed By", "fieldtype": "Data"},
        {"fieldname": "Status", "label": "Status", "fieldtype": "Select", "options": "\n".join(["Open", "Working", "Pending Review", "Overdue", "In Progress", "Completed", "Cancelled", "Template"])},
        {"fieldname": "Is Attachments Need", "label": "Is Attachments Need", "fieldtype": "Check"},
        {"fieldname": "Attachment", "label": "Attachment", "fieldtype": "HTML"},  # Set as HTML to display images
    ]
    
    return columns, data
