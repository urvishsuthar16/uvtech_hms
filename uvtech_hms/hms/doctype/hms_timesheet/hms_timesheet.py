import frappe
from frappe.model.document import Document
from datetime import datetime

class HmsTimesheet(Document):
    def validate(self):
        # Check for overlapping date ranges for the selected employee
        overlapping_timesheets = frappe.db.sql("""
            SELECT name FROM `tabHms Timesheet`
            WHERE employee = %(employee)s
            AND (
                (start_date <= %(end_date)s AND end_date >= %(start_date)s)
            )
            AND name != %(current_name)s
        """, {
            "employee": self.employee,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "current_name": self.name or ""
        })

        if overlapping_timesheets:
            frappe.throw("This employee already has a timesheet in the specified date range.")

        # Fetch attendance records for the specified employee and date range
        hms_attendance = frappe.get_list('Hms Attendance',
            filters={
                'employee': self.employee,
                'attendance_date': ['between', [self.start_date, self.end_date]],
                'status': 'Present'
            },
            fields=['name', 'in_time', 'out_time', 'attendance_date', 'status', 'employee', 'employee_name',
                    'working_hours']
        )

        employee_rates = frappe.get_all('Employee Rates',
            filters={'parent': self.employee},
            fields=['day', 'standard_hours', 'standard_rate', 'extra_rate']
        )
        
        rates_by_day = {rate.day: rate for rate in employee_rates}

        existing_attendance = [row.attendance_date for row in self.timesheet_table]
        for record in hms_attendance:
            if str(record.attendance_date) not in existing_attendance:
                # Determine the weekday of the attendance date
                weekday = record.attendance_date.strftime("%A")

                # Fetch rates and hours based on the weekday
                if weekday in rates_by_day:
                    standard_hours = rates_by_day[weekday].standard_hours
                    standard_rate = rates_by_day[weekday].standard_rate
                    extra_rate = rates_by_day[weekday].extra_rate
                else:
                    # Set default values if no rates are defined for the weekday
                    standard_hours = 0
                    standard_rate = 0
                    extra_rate = 0

                # Calculate standard and extra amounts
                standard_amount = standard_rate * record.working_hours
                extra_hours = max(record.working_hours - standard_hours, 0)
                extra_amount = extra_rate * extra_hours
                amount = 0
                if extra_hours > 0:
                    amount = extra_amount +  standard_rate * standard_hours
                else:
                    amount = standard_amount


                in_time_str = record.in_time.strftime("%H:%M:%S") if record.in_time else None
                out_time_str = record.out_time.strftime("%H:%M:%S") if record.out_time else None

                # Append data to the timesheet table
                self.append("timesheet_table", {
                    "from_time": in_time_str,
                    "to_time": out_time_str,
                    "attendance_date": record.attendance_date,
                    "employee": record.employee,
                    'standard_rate': standard_rate,
                    "standard_hours": standard_hours,
                    "standard_amount": standard_amount,
                    "extra_hours": extra_hours,
                    "extra_rate": extra_rate,
                    "extra_amount": extra_amount,
                    "hours": record.working_hours,
                    'amount': amount,
                    'status': record.status,
                    'employee_name': record.employee_name
                })
        
        # Calculate and update total hours and total amount in the timesheet
        self.total_hours = sum([row.hours for row in self.timesheet_table])
        self.total_time = sum([row.amount for row in self.timesheet_table])
