import React, { useMemo, useCallback } from 'react';
import { Chart, Axis, SmoothLine, SmoothArea, View, Guide } from 'viser-react';
import Slider, { SliderValue } from 'antd/lib/slider';
import i18n from '../i18n';

const DataSet = require('@antv/data-set');

interface IProps {
  pools: Array<{
    term: number;
    loanInterestRate: number;
    availableAmount: number;
  }>;
  symbol?: string;
  maxBorrowTerm: number;
  selectedTerm: number;
  onTermChange?: (term: number) => void;
  t: i18n.TFunction;
}

const BorrowPoolChart = (props: IProps) => {
  const { pools, maxBorrowTerm, selectedTerm, onTermChange, symbol, t } = props;

  const pointValue = useMemo(
    () =>
      pools.find(pool => pool.term === selectedTerm) || {
        term: selectedTerm,
        availableAmount: 0,
        loanInterestRate: 0,
      },
    [pools, selectedTerm],
  );

  const dataSet = useMemo(() => new DataSet.View().source(pools), [pools]);

  const APRChartScale = [
    {
      dataKey: 'APR',
      tickCount: 2,
    },
    {
      dataKey: 'term',
      min: 1,
      max: maxBorrowTerm,
      ticks: [1, maxBorrowTerm],
      nice: false,
    },
  ];

  const availableAmountChartScale = [
    {
      dataKey: 'availableAmount',
      tickCount: 2,
      nice: false,
    },
    {
      dataKey: 'term',
      min: 1,
      max: maxBorrowTerm,
      ticks: [1, maxBorrowTerm],
      nice: false,
    },
  ];

  const onSliderChange = useCallback(
    (v: SliderValue) => onTermChange && onTermChange(v as number),
    [],
  );

  const APRCrossPoint =
    '<div style="width: 20px; height: 20px; border: 2px solid #fff; border-radius: 50%; background-color: #FF6DC4" />';

  const availableAmountCrossPoint =
    '<div style="width: 14px; height: 14px; border: 2px solid #fff; border-radius: 50%; background-color: #FF6DC4" />';

  return (
    <div id="borrow_chart">
      <Chart forceFit height={300} data={dataSet} padding={[20, 10]}>
        <View data={dataSet} scale={APRChartScale} end={{ x: 1, y: 0.3 }}>
          <Guide
            type="line"
            top
            start={[selectedTerm, 0]}
            end={[selectedTerm, 'max']}
            lineStyle={{
              stroke: 'rgba(44, 60, 87, 0.1)',
              lineDash: [0],
              lineWidth: 4,
            }}
          />
          <Guide
            type="html"
            position={[selectedTerm, pointValue.loanInterestRate]}
            html={APRCrossPoint}
            offsetX={2}
          />
          {/* APR line */}
          <SmoothLine position="term*loanInterestRate" color="#52cc6580" />
        </View>
        <View
          data={dataSet}
          scale={availableAmountChartScale}
          coord={{ radius: 0, startAngle: 0, endAngle: 0 }}
          start={{ x: 0, y: 0.3 }}
        >
          <Axis dataKey="availableAmount" show={false} />
          <Axis dataKey="term" />
          <SmoothArea position="term*availableAmount" color="#ff6dc4" />
          <Guide
            type="html"
            position={[selectedTerm, pointValue.availableAmount]}
            html={availableAmountCrossPoint}
            offsetX={2}
          />
        </View>
      </Chart>
      <Slider
        value={selectedTerm}
        onChange={onSliderChange}
        max={maxBorrowTerm}
        min={1}
      />

      <div className="label">
        <span
          className="liquidity"
          title={t('borrow_pool_card_text_available_amount')}
        >
          {t('borrow_pool_card_text_available_amount')}:{' '}
          {pointValue.availableAmount} {symbol}
        </span>
        <span className="apr">
          {t('borrow_overview_loan_apr')}:{' '}
          {(pointValue.loanInterestRate * 100).toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default BorrowPoolChart;
