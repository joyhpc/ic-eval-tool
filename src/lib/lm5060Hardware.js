export const DEFAULT_HW_PARAMS = {
  vinMin: 9.0,
  vinMax: 36.0,
  iLimit: 30.0,
  rdsOn: 5.0,
  ocpDelay: 12.0,
  dvdt: 0.5,
};

export function computeHardwareResults(hwParams) {
  const { vinMin, vinMax, iLimit, rdsOn, ocpDelay, dvdt } = hwParams;
  const ovpThreshold = 2.0;
  const uvloThreshold = 1.6;
  const uvloBias = 0.0055;
  const r8 = 10 * (vinMax - ovpThreshold) / ovpThreshold;
  const r10 = (vinMin - uvloThreshold) / (uvloBias + (uvloThreshold / 10));
  const cTimer = (ocpDelay * 11) / 2.0;
  const vDsth = iLimit * (rdsOn / 1000);
  const rs = (vDsth / 16e-6) + ((10e3 * 8e-6) / 16e-6);
  const cGate = (24 / (dvdt * 1000)) * 1e6;

  return {
    R8: r8 > 0 ? r8.toFixed(2) : '0.00',
    R10: r10 > 0 ? r10.toFixed(2) : '0.00',
    C_TIMER: cTimer.toFixed(1),
    Rs: rs.toFixed(2),
    C_GATE: cGate.toFixed(1),
    V_DSTH: (vDsth * 1000).toFixed(1),
  };
}
