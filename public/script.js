const otpOverlay = document.getElementById('otpOverlay');
const pdfViewer = document.getElementById('pdfViewer');
const otpInput = document.getElementById('otpInput');
const otpMessage = document.getElementById('otpMessage');

let sessionTimer;

function sendOtp() {
  fetch('/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    .then(res => res.json())
    .then(data => {
      otpMessage.textContent = data.message;
      otpMessage.style.color = data.success ? 'green' : 'red';
    })
    .catch(() => otpMessage.textContent = "Network error. Try again.");
}

function submitOtp() {
  const otp = otpInput.value.trim();
  if (otp.length !== 6) {
    otpMessage.textContent = "Enter a valid 6-digit OTP.";
    otpMessage.style.color = 'red';
    return;
  }

  fetch('/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ otp })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        otpOverlay.style.display = 'none';
        pdfViewer.style.display = 'block';
        otpMessage.textContent = "";
        loadPDF();
        startSessionTimeout();
      } else {
        otpMessage.textContent = data.message;
        otpMessage.style.color = 'red';
      }
    });
}

function loadPDF() {
  pdfViewer.innerHTML = '';
  pdfjsLib.getDocument('report.pdf').promise.then(pdf => {
    for (let i = 1; i <= pdf.numPages; i++) {
      pdf.getPage(i).then(page => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const viewport = page.getViewport({ scale: 1.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        page.render({ canvasContext: context, viewport: viewport });
        pdfViewer.appendChild(canvas);
      });
    }
  });
}

function startSessionTimeout() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    pdfViewer.style.display = 'none';
    otpOverlay.style.display = 'flex';
    otpInput.value = '';
    otpMessage.textContent = 'Your session expired! Please request a new OTP.';
    otpMessage.style.color = 'orange';

    // Reset Get OTP button
    requestOtpBtn.disabled = false;
    requestOtpBtn.textContent = 'Get OTP';
  }, 60000); // 1 minute session
}


const requestOtpBtn = document.getElementById('requestOtpBtn');
requestOtpBtn.addEventListener('click', () => {
  sendOtp();
  requestOtpBtn.disabled = true;
  requestOtpBtn.textContent = 'OTP Sent (Wait 1 min)';
  setTimeout(() => {
    requestOtpBtn.disabled = false;
    requestOtpBtn.textContent = 'Get OTP';
  }, 60000); // 1 minute lock
});

document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'p')) || e.key === 'F12') {
      e.preventDefault();
    }
  });