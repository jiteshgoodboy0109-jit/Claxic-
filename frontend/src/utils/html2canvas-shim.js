// html2canvas shim for jsPDF integration in Vite
export default function html2canvas() {
  return Promise.resolve(document.createElement('canvas'));
}
