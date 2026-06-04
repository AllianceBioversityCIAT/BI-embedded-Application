function url(data) {
  let queryParams = '';
  for (let key in data) {
    if (data[key]) {
      queryParams += `&${key}=${data[key]}`;
    }
  }
  const baseUrl = 'https://bi.prms.cgiar.org/bi'
  const url = `${baseUrl}/${data?.reportName ?? 'cgiar-results-dashboard'}${queryParams ? '?' : ''}${queryParams}`;
  return url;
}
let widget = null;

const pbiwidget = {
  init: (divId, data) => {
    widget = document.getElementById(divId);
    let iframe = document.createElement('iframe');
    iframe.setAttribute('id', 'iframe-dashboardEmbed');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('src', url(data));
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    widget.style.width = "100%";
    widget.style.height = data?.height || '1000px';
    widget.appendChild(iframe);


    if (data.autoSize) window.addEventListener(
      "message",
      function (event) {
        if (event.origin !== "http://localhost:4200" && event.origin !== "https://bi.prms.cgiar.org/" && event.origin !== "https://bitest.ciat.cgiar.org/bi-list")
          return;
        const message = event.data;
        if (message.type === "pagechange")
          document.getElementById('iframe-dashboardEmbed').style.height = message.currentHeight + 'px';

      },
      false
    );



  },

}
