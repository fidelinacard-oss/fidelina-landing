/**
 * Réglages de la page d'accueil : à modifier ici seulement.
 * appUrl : adresse de l'espace commerçant (en production, par exemple https://app.fidelina.ma).
 */
window.FIDELINA = {
  appUrl: 'https://app.fidelina.ma',
  whatsapp: '212601882195', // numéro au format international, sans « + » ni espaces
  whatsappMessage: 'السلام، بغيت نعرف كثر على Fidelina (كارطة الوفاء) للمحل ديالي.',
  instagram: 'fidelina.card',
  // Messages WhatsApp des 3 formules (section #plans) : aucun prix affiché sur la page
  plans: {
    essentiel: 'السلام، بغيت باقة Essentiel ديال Fidelina:\n- 1 فرع\n- 2 حسابات\n- كليان بلا حد\n- الكارطة فالتيليفون، التسجيل بـ QR، السكانير، النقط والهدايا، الكارطة باللوغو ديالي والإحصائيات\nبغيت نعرف الثمن والتفاصيل.',
    pro: 'السلام، بغيت باقة Pro ديال Fidelina:\n- 2 فروع\n- 6 حسابات\n- كليان بلا حد\n- كلشي اللي ف Essentiel + حساب لكل خدام، إحصائيات كل فرع، والتركيب والتكوين فالمحل\nبغيت نعرف الثمن والتفاصيل.',
    business: 'السلام، بغيت باقة Business ديال Fidelina:\n- 5 فروع\n- 25 حساب\n- كليان بلا حد\n- كلشي اللي ف Pro + أفيش QR لكل فرع، مرافقة فالإطلاق ودعم بالأولوية\nبغيت نعرف الثمن والتفاصيل.',
  },
};

// Applique les liens : [data-link="whatsapp" | "instagram" | "app"]
document.addEventListener('DOMContentLoaded', () => {
  const c = window.FIDELINA;
  const links = {
    whatsapp: `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(c.whatsappMessage)}`,
    instagram: `https://ig.me/m/${c.instagram}`,
    instagramProfile: `https://www.instagram.com/${c.instagram}/`,
    app: `${c.appUrl}/login`,
  };
  document.querySelectorAll('[data-link]').forEach((a) => {
    const url = links[a.dataset.link];
    if (url) a.setAttribute('href', url);
  });
  document.querySelectorAll('[data-plan]').forEach((a) => {
    const msg = c.plans && c.plans[a.dataset.plan];
    if (msg) a.setAttribute('href', `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(msg)}`);
  });
  document.querySelectorAll('[data-text="instagram"]').forEach((el) => (el.textContent = `@${c.instagram}`));

  // Menu mobile
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
});
