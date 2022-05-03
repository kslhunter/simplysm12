export const fc_package_index = (opt: { description: string }): string => /* language=html */ `

<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>${opt.description}</title>
  <meta name="viewport" content="initial-scale=1, width=device-width, viewport-fit=cover">
  <link rel="shortcut icon" type="image/x-icon" href="favicon.ico">
  <meta name="format-detection" content="telephone=no">
  <meta name="msapplication-tap-highlight" content="no">
</head>
<body>
<app-root>
  <style>
    *,
    *:after,
    *:before {
      box-sizing: border-box;
    }

    html, body {
      padding: 0;
      margin: 0;
      background: #f5f5f5;
    }

    .app-loader-bar {
      position: fixed;
      top: 0;
      left: 0;
      height: 2px;
      width: 100%;
      background-color: white;
    }

    .app-loader-bar > div {
      position: fixed;
      top: 0;
      left: 0;
      display: inline-block;
      height: 2px;
      width: 100%;

      transform-origin: left;
    }

    .app-loader-bar > div:first-child {
      background-color: #3f51b5;
      animation: app-loader-bar-1 2s infinite ease-in;
    }

    .app-loader-bar > div:last-child {
      background-color: white;
      animation: app-loader-bar-2 2s infinite ease-out;
    }

    @keyframes app-loader-bar-1 {
      0% {
        transform: scaleX(0);
      }
      60%, 100% {
        transform: scaleX(1.0);
      }
    }

    @keyframes app-loader-bar-2 {
      0%, 50% {
        transform: scaleX(0);
      }
      100% {
        transform: scaleX(1.0);
      }
    }
  </style>

  <div class="app-loader-bar">
    <div></div>
    <div></div>
  </div>
</app-root>

<noscript>Please enable JavaScript to continue using this application.</noscript>
</body>
</html>

`.trim();
