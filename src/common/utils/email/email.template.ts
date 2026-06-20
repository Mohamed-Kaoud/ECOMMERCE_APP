export const emailTemplate = (otp: number) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
</head>

<body style="
  margin:0;
  padding:0;
  background:linear-gradient(135deg,#f8fafc,#e0e7ff);
  font-family:Arial, sans-serif;
">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:60px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="460" cellpadding="0" cellspacing="0"
          style="
            background:#0f172a;
            border-radius:20px;
            box-shadow:0 20px 50px rgba(0,0,0,0.25);
            color:#fff;
          ">

          <!-- Header -->
          <tr>
            <td style="padding:28px; text-align:center;">
              <h2 style="
                margin:0;
                font-weight:600;
                letter-spacing:1px;
              ">
                Welcome to Social Media App 👋
              </h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:35px; text-align:center;">

              <p style="font-size:14px; color:#cbd5e1; margin-bottom:25px;">
                Enter this code to continue
              </p>

              <!-- OTP -->
              <div style="
                display:inline-block;
                padding:20px 32px;
                border-radius:14px;
                background:linear-gradient(90deg,#7c3aed,#4f46e5);
              ">
                <span style="
                  font-size:34px;
                  letter-spacing:10px;
                  font-weight:bold;
                  color:#fff;
                ">
                  ${otp}
                </span>
              </div>

              <p style="
                font-size:12px;
                color:#94a3b8;
                margin-top:25px;
              ">
                ⏳ Expires in <span style="color:#fff;">2 minutes</span>
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}