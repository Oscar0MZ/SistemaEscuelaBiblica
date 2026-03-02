window.PdfService = {
    generarReporte: (titulo, subtitulo, columnas, filas) => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Encabezado
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(titulo, 14, 22);
        
        // Subtítulo y Fecha
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(subtitulo, 14, 30);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 36);

        // Tabla automática
        doc.autoTable({
            startY: 42,
            head: [columnas],
            body: filas,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }, // Indigo-600
            styles: { fontSize: 9, cellPadding: 4 },
            alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
        });

        // Guardar archivo
        const nombreArchivo = `${titulo.replace(/ /g, '_')}_${new Date().getTime()}.pdf`;
        doc.save(nombreArchivo);
    }
};
