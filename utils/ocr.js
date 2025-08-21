import Tesseract from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';
import { createCanvas } from 'canvas';
import axios from 'axios';

const doOCR = async (url, mime) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);

  if (mime === 'application/pdf') {
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdfDoc = await loadingTask.promise;
    let text = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;
      const imgBuffer = canvas.toBuffer('image/png');
      const { data: { text: pageText } } = await Tesseract.recognize(imgBuffer, { lang: 'eng' });
      text += pageText + '\n';
    }
    return text.trim();
  } else {
    const { data: { text } } = await Tesseract.recognize(buffer, { lang: 'eng' });
    return text.trim();
  }
};

export { doOCR };