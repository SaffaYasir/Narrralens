import React from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#a5b4fc', '#f0abfc', '#34d399', '#fb923c', '#60a5fa', '#f472b6', '#a3e635'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 13,
    }}>
      {label && <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || 'var(--primary-light)' }}>
          {p.name}: <strong>{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ChartBlock({ chart, delay = 0 }) {
  if (!chart || !chart.data?.length) return null;

  const containerStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: 24,
    animation: `fadeUp 0.5s ease ${delay}s both`,
    transition: 'border-color 0.2s',
  };

  const titleStyle = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 20,
    color: 'var(--text)',
  };

  const axisStyle = {
    fill: 'var(--text-faint)',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
  };

  if (chart.type === 'line') {
    return (
      <div style={containerStyle}>
        <p style={titleStyle}>{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey={chart.xKey} tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey={chart.yKey}
              stroke="#6366f1" strokeWidth={2.5}
              dot={false} activeDot={{ r: 5, fill: '#a5b4fc' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === 'bar') {
    return (
      <div style={containerStyle}>
        <p style={titleStyle}>{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chart.data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={chart.xKey} tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={chart.yKey} fill="#6366f1" radius={[4, 4, 0, 0]}>
              {chart.data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === 'histogram') {
    return (
      <div style={containerStyle}>
        <p style={titleStyle}>{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chart.data} barCategoryGap="5%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey={chart.xKey} tick={{ ...axisStyle, fontSize: 9 }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={chart.yKey} fill="#818cf8" radius={[2, 2, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === 'scatter') {
    return (
      <div style={containerStyle}>
        <p style={titleStyle}>{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="x" name={chart.xLabel} tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis dataKey="y" name={chart.yLabel} tick={axisStyle} tickLine={false} axisLine={false} width={60} />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={chart.data} fill="#f0abfc" opacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chart.type === 'pie') {
    return (
      <div style={containerStyle}>
        <p style={titleStyle}>{chart.title}</p>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chart.data}
              dataKey={chart.valueKey}
              nameKey={chart.nameKey}
              cx="50%" cy="50%"
              outerRadius={90}
              innerRadius={40}
              paddingAngle={3}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'var(--border)' }}
            >
              {chart.data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
