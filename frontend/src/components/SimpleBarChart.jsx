function formatValue(value, kind) {
  if (kind === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(Number(value || 0));
  }

  return `${Number(value || 0)} kg`;
}

export function SimpleBarChart({ title, subtitle, data, valueKey, labelKey, tone = "brand", kind = "currency" }) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 0);

  return (
    <section className="card chart-card">
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="chart-list">
        {data.length ? (
          data.map((item) => {
            const value = Number(item[valueKey] || 0);
            const width = max > 0 ? `${Math.max((value / max) * 100, 6)}%` : "0%";

            return (
              <article key={`${item[labelKey]}-${value}`} className="chart-row">
                <div className="chart-meta">
                  <strong>{item[labelKey]}</strong>
                  <span>{formatValue(value, kind)}</span>
                </div>
                <div className="chart-track">
                  <div className={`chart-bar ${tone}`} style={{ width }} />
                </div>
              </article>
            );
          })
        ) : (
          <p className="empty-state">Ainda nao ha dados suficientes para gerar este grafico.</p>
        )}
      </div>
    </section>
  );
}
