import frappe
from frappe.model.document import Document
from datetime import datetime

class HmsTimesheet(Document):
    def validate(self):
        hms_attendance = frappe.get_list('Hms Attendance',
        filters={
            'employee': self.employee,
            'attendance_date': ['between', [self.start_date, self.end_date]],
            'status': 'Present'
        },
        fields=['name', 'in_time', 'out_time', 'attendance_date','status','employee',
        'standard__rate','standard_hours','extra_hours','extra_rate','working_hours']
        )

        existing_attendance = [ row.attendance_date for row in self.timesheet_table]

        # Loop through the attendance records
        for i in hms_attendance:
            if str(i.attendance_date) not in existing_attendance:
                standard_amount = i.standard__rate*i.standard_hours
                extra_amount = i.extra_rate*i.extra_hours
                amount = standard_amount + extra_amount
                
                self.append("timesheet_table", {
                    "from_time": i.in_time,
                    "to_time": i.out_time,
                    "attendance_date": i.attendance_date,
                    "employee": i.employee,
                    'standard_rate': i.standard__rate,
                    "standard_hours":i.standard_hours,
                    "standard_amount":standard_amount,
                    "extra_hours":i.extra_hours,
                    "extra_rate":i.extra_rate,
                    "extra_amount":extra_amount,
                    "hours": i.working_hours,
                    'amount': amount,
                    'status':i.status
                })
                
        self.total_hours = sum([row.hours for row in self.timesheet_table])
        self.total_time = sum([row.amount for row in self.timesheet_table])