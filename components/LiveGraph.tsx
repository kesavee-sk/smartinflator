import React from 'react';
import { Dimensions, View, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface LiveGraphProps {
  pressureData: number[];
  isStarted: boolean;
}

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
  strokeWidth: 2,
  decimalPlaces: 0,
  propsForDots: {
    r: '2',
    strokeWidth: '1',
    stroke: '#2196F3',
  },
};

const LiveGraph: React.FC<LiveGraphProps> = ({ pressureData, isStarted }) => {
  const filteredData = pressureData.filter(
    (val) => !isNaN(val) && isFinite(val)
  );

  const displayData = filteredData.length > 0 ? filteredData : [0];

  return (
    <View>
      <Text
        style={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 16,
          marginBottom: 8,
        }}
      >
        {isStarted ? 'Live Pressure Data' : 'Waiting to Start...'}
      </Text>

      <LineChart
        data={{
          labels: Array(displayData.length).fill(''),
          datasets: [
            {
              data: displayData,
              color: () => '#2196F3',
            },
          ],
        }}
        width={screenWidth - 20}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
          alignSelf: 'center',
        }}
      />
    </View>
  );
};

export default LiveGraph;
