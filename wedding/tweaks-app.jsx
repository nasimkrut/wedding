// tweaks-app.jsx — панель Tweaks для свадебного приглашения
// Управляет визуальным направлением (тема), лепестками и шрифтом имён.

const WEDDING_TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "registan",
  "petals": true,
  "nameFont": "serif"
}/*EDITMODE-END*/;

function WeddingTweaks() {
  const [t, setTweak] = useTweaks(WEDDING_TWEAKS);

  React.useEffect(() => {
    if (window.applyWeddingTweaks) window.applyWeddingTweaks(t);
  }, [t.theme, t.petals, t.nameFont]);

  return (
    <TweaksPanel title="Оформление">
      <TweakSection label="Визуальное направление" />
      <TweakRadio
        label="Тема"
        value={t.theme}
        options={[
          { value: 'registan', label: 'Регистан' },
          { value: 'suzani', label: 'Сюзане' },
          { value: 'tungi', label: 'Тунги' },
        ]}
        onChange={(v) => setTweak('theme', v)}
      />
      <div style={{ fontSize: '10.5px', lineHeight: 1.45, color: 'rgba(41,38,27,.5)', marginTop: '-2px' }}>
        Регистан — тёмная майолика · Сюзане — тёплый кремовый · Тунги — минимализм
      </div>

      <TweakSection label="Детали" />
      <TweakRadio
        label="Шрифт имён"
        value={t.nameFont}
        options={[
          { value: 'serif', label: 'Классика' },
          { value: 'script', label: 'Каллиграф.' },
        ]}
        onChange={(v) => setTweak('nameFont', v)}
      />
      <TweakToggle
        label="Падающие лепестки"
        value={t.petals}
        onChange={(v) => setTweak('petals', v)}
      />
    </TweaksPanel>
  );
}

(function mountTweaks() {
  function go() {
    var root = document.getElementById('tweaks-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tweaks-root';
      document.body.appendChild(root);
    }
    // применить значения по умолчанию сразу при загрузке
    if (window.applyWeddingTweaks) window.applyWeddingTweaks(WEDDING_TWEAKS);
    ReactDOM.createRoot(root).render(<WeddingTweaks />);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
  else go();
})();
