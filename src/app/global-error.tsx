"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Something went wrong — LustPages</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            margin: 0;
            font-family: system-ui, sans-serif;
            background: #0f0f0f;
            color: #e5e5e5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            padding: 2rem;
          }
          .card {
            max-width: 420px;
            width: 100%;
            padding: 2.5rem 2rem;
            border-radius: 1.25rem;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
          }
          h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem; color: #fff; }
          p { font-size: 0.875rem; color: #888; margin: 0 0 1.5rem; }
          button, .home-link {
            display: inline-block;
            padding: 0.625rem 1.5rem;
            border-radius: 0.75rem;
            border: none;
            background: #c4426a;
            color: #fff;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.15s;
            text-decoration: none;
          }
          button:hover, .home-link:hover { opacity: 0.85; }
          .btn-row { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
          .home-link { background: #2a2a2a; border: 1px solid #3a3a3a; color: #aaa; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try again.</p>
          <div className="btn-row">
            <button onClick={reset}>Try again</button>
            <a href="/" className="home-link">Go home</a>
          </div>
        </div>
      </body>
    </html>
  );
}
