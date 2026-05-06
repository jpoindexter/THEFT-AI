export default function ThemeBoot() {
  // Inline script that runs before paint to avoid a flash of light theme.
  const code = `(()=>{try{var s=localStorage.getItem('theft-theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
