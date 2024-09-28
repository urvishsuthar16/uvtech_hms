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
            employee_name AS `Employee Name`,
            standard_hours AS `Standard Hours`,
            extra_hours AS `Extra Hours`,
            (standard_hours + extra_hours) AS `Working Hours`,
            standard__rate AS `Standard Rate`,
            extra_rate AS `Extra Rate`,
            (standard_hours * standard__rate + extra_hours * extra_rate) AS `Total Amount`
        FROM 
            `tabHms Attendance`
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
    
    # Return columns and data
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
