frappe.realtime.on("downstream_api", (data) => {
    console.log("Received real-time event:", data);
    frappe.toast({
        message: data.message,
        indicator: data.indicator || "red",
    }, 6);

    setTimeout(() => {
        window.location.href = "/app/hms-checkin";
    }, 6000);
});

