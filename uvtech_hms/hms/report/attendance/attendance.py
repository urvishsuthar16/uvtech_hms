import frappe

def execute(filters=None):
    # Access filter values
    employee = filters.get("employee")
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")
    
    # Construct the SQL query using filter values
    query = """
        SELECT 
            attendance_date AS `Attendance Date`,
            employee AS `Employee`,
            standard_hours AS `Standard Hours`,
            extra_hours AS `Extra Hours`,
            hours AS `Working Hours`,
            standard_rate AS `Standard Rate`,
            extra_rate AS `Extra Rate`,
            amount AS `Total Amount`,
            employee_name AS `Employee Name`
        FROM 
            `tabtimesheet table`
        WHERE 
            employee = %(employee)s
            AND attendance_date BETWEEN %(start_date)s AND %(end_date)s
        ORDER BY 
            attendance_date
    """

    # Execute the SQL query with filters
    data = frappe.db.sql(query, {
        'employee': employee,
        'start_date': start_date,
        'end_date': end_date
    }, as_dict=True)

    # Calculate totals for specific fields
    total_standard_hours = sum(d.get("Standard Hours", 0) for d in data)
    total_extra_hours = sum(d.get("Extra Hours", 0) for d in data)
    total_working_hours = sum(d.get("Working Hours", 0) for d in data)
    total_amount = sum(d.get("Total Amount", 0) for d in data)

    # Append a row for the totals at the end of the data list
    total_row = {
        "Attendance Date": "",
        "Employee": "",
        "Employee Name": "Total",
        "Standard Hours": total_standard_hours,
        "Extra Hours": total_extra_hours,
        "Working Hours": total_working_hours,
        "Standard Rate": "",
        "Extra Rate": "",
        "Total Amount": total_amount
    }
    data.append(total_row)

    # Define columns
    columns = [
        {"fieldname": "Attendance Date", "label": "Attendance Date", "fieldtype": "Date"},
        {"fieldname": "Employee", "label": "Employee", "fieldtype": "Link", "options": "Employee"},
        {"fieldname": "Employee Name", "label": "Employee Name", "fieldtype": "Data"},
        {"fieldname": "Standard Hours", "label": "Standard Hours", "fieldtype": "Float", "precision": 2},
        {"fieldname": "Extra Hours", "label": "Extra Hours", "fieldtype": "Float", "precision": 2},
        {"fieldname": "Working Hours", "label": "Working Hours", "fieldtype": "Float", "precision": 2},
        {"fieldname": "Standard Rate", "label": "Standard Rate", "fieldtype": "Currency", "precision": 2},
        {"fieldname": "Extra Rate", "label": "Extra Rate", "fieldtype": "Currency", "precision": 2},
        {"fieldname": "Total Amount", "label": "Total Amount", "fieldtype": "Currency", "precision": 2}
    ]
    
    return columns, data
