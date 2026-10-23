'use client';

type CountRow = {
  label: string;
  unassignedCount: number;
  assignedCount?: number;
};

type BreakdownRow = {
  name: string;
  count: number;
};

interface Props {
  generatedAt: string;
  filters: {
    academicYear: string;
    studentGroup: string;
    cycle: string;
    state: string;
    district: string;
    mandal: string;
  };
  summary: {
    totalLeads: number;
    assignedCount: number;
    unassignedCount: number;
  };
  stateBreakdown: BreakdownRow[];
  mandalBreakdown: BreakdownRow[];
  districtAssignmentBreakdown: CountRow[];
  mandalAssignmentBreakdown: CountRow[];
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '8px',
  marginBottom: '16px',
  fontSize: '12px',
};

const thTdStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  padding: '6px 8px',
  textAlign: 'left',
};

export default function UnassignedLocationPrintView({
  generatedAt,
  filters,
  summary,
  stateBreakdown,
  mandalBreakdown,
  districtAssignmentBreakdown,
  mandalAssignmentBreakdown,
}: Props) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#111827', padding: '12px' }}>
      <h2 style={{ margin: 0 }}>Unassigned by Location Report</h2>
      <p style={{ marginTop: '6px', marginBottom: '10px', fontSize: '12px' }}>Generated: {generatedAt}</p>
      <p style={{ marginTop: 0, marginBottom: '14px', fontSize: '12px' }}>
        Filters - Academic year: {filters.academicYear}, Student group: {filters.studentGroup}, Cycle: {filters.cycle},
        State: {filters.state}, District: {filters.district}, Mandal: {filters.mandal}
      </p>

      <h3 style={{ margin: '6px 0' }}>Summary</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>Total Leads</th>
            <th style={thTdStyle}>Assigned Leads</th>
            <th style={thTdStyle}>Unassigned Leads</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={thTdStyle}>{summary.totalLeads.toLocaleString()}</td>
            <td style={thTdStyle}>{summary.assignedCount.toLocaleString()}</td>
            <td style={thTdStyle}>{summary.unassignedCount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ margin: '6px 0' }}>Unassigned by State</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>State</th>
            <th style={thTdStyle}>Count</th>
          </tr>
        </thead>
        <tbody>
          {stateBreakdown.length ? (
            stateBreakdown.map((row) => (
              <tr key={`state-${row.name}`}>
                <td style={thTdStyle}>{row.name}</td>
                <td style={thTdStyle}>{row.count.toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={thTdStyle} colSpan={2}>No data</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3 style={{ margin: '6px 0' }}>Unassigned by Mandal (Overall)</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thTdStyle}>Mandal</th>
            <th style={thTdStyle}>Count</th>
          </tr>
        </thead>
        <tbody>
          {mandalBreakdown.length ? (
            mandalBreakdown.map((row) => (
              <tr key={`mandal-${row.name}`}>
                <td style={thTdStyle}>{row.name}</td>
                <td style={thTdStyle}>{row.count.toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td style={thTdStyle} colSpan={2}>No data</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

