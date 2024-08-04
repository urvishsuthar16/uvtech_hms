frappe.ui.form.on('Task', {
    refresh(frm) {
        // Initialize base HTML
        let base_html = `<div style="display: flex; flex-wrap: wrap;">`;

        // Loop through each custom image and append the HTML
        for (let row of frm.doc.custom_images) {
            let image_path = row.images;
            let image_html = `<a href="${image_path}" target="_blank" style="margin: 5px;">
                                <img src="${image_path}" alt="Image" style="height: 240px; width: auto;"/>
                              </a>`;
            base_html += image_html;
        }

        // Close the base HTML div
        base_html += `</div>`;

        // Set the custom_preview field with the constructed HTML
        // frm.set_value('custom_preview', base_html);
        frm.set_df_property('custom_preview', 'options', base_html)
        
    }
});
