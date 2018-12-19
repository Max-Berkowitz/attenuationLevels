import React, { Fragment, Component } from 'react';
import { get, post } from 'axios';
import styled from 'styled-components';
import CodePlot from './codePlot';

const UnitForm = styled.form`
  display: inline-block;
`;

const UnitNumberLabel = styled.label`
  display: inline-block;
  font-size: 150%;
  margin-left: 5px;
`;

const UnitNumber = styled.input`
  display: inline-block;
  width: 35px;
  margin-left: 15px;
  margin-bottom: 10px;
  transform: scale(1.45);
`;

const ProgramTitle = styled.h1`
  display: inline-block;
  font-size: 150%;
  margin-left: 233px;
`;

const Refresh = styled.button`
  padding: 5px 5px;
  margin-left: 233px;
  margin-right: 10px;
`;

const Reconnect = styled.button`
  padding: 5px 5px;
`;

const ChannelText = styled.label`
  display: inline-block;
  font-size: 150%;
  margin-left: 40px;
`;

const ChannelRadio = styled.input`
  display: inline-block;
  margin-right: 25px;
  margin-left: 10px;
  transform: scale(1.25);
`;

const ApplyDefault = styled.button`
  padding: 14px 16px;
  margin-right: 10px;
  margin-left: 130px;
  font-size: 100%;
`;

const SetDefault = styled.button`
  padding: 14px 16px;
  font-size: 100%;
`;

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = { codes: [], channel: 0, unit: '' };

    this.getAllCodes = this.getAllCodes.bind(this);
    this.connect = this.connect.bind(this);
    this.handleUnitNumberChange = this.handleUnitNumberChange.bind(this);
    this.handleChannelSwitch = this.handleChannelSwitch.bind(this);
    this.handleApplyDefaults = this.handleApplyDefaults.bind(this);
    this.handleSetDefaults = this.handleSetDefaults.bind(this);
    this.handleCodeChange = this.handleCodeChange.bind(this);
    this.handleTempCodeChange = this.handleTempCodeChange.bind(this);
  }

  async componentDidMount() {
    await get('/api/configure');
  }

  async getAllCodes() {
    try {
      const {
        data: { codes },
      } = await get('/api/getAllCodes');
      this.setState({ codes });
    } catch (e) {
      alert(e); // eslint-disable-line no-alert
    }
  }

  async connect() {
    await get('/api/configure');
    await this.getAllCodes();
  }

  handleUnitNumberChange({ target: { value } }) {
    this.setState({ unit: +value });
  }

  async handleChannelSwitch({ target: { value } }) {
    const { unit } = this.state;
    if (!unit) return;
    await this.getAllCodes();
    this.setState({ channel: +value });
  }

  /* eslint-disable no-alert */
  async handleApplyDefaults() {
    const { channel, unit } = this.state;
    if (channel && !window.confirm(`This will apply the defaults for channel ${channel} to the unit, are you sure?`))
      return;
    try {
      const {
        data: { defaults: codes },
      } = await get('/api/defaults', { params: { channel } });
      await Promise.all([
        post('/api/setAllCodes', { codes }),
        post('/api/saveAllCodes', { codes }),
        post('/api/current', { channel, values: codes, unit }),
      ]);
      await this.getAllCodes();
    } catch (e) {
      alert(e);
    }
  }

  async handleSetDefaults() {
    const { channel, codes: defaults } = this.state;
    if (
      channel &&
      !window.confirm(`This will set the defaults for channel ${channel} to the current values, are you sure?`)
    )
      return;
    try {
      await post('/api/defaults', { channel, defaults });
    } catch (e) {
      alert(e);
    }
  }
  /* eslint-enable no-alert */

  async handleCodeChange(level, newCode) {
    const { channel, codes, unit } = this.state;
    try {
      await post('/api/setCode', { level, code: newCode });
      await post('/api/saveCode', { level, code: newCode });
      const {
        data: { code },
      } = await get('/api/getCode', { params: { level } });
      codes[12 - level][1] = code;
      await post('/api/current', { channel, values: codes, unit });
      this.setState({ codes });
    } catch (e) {
      alert(e); // eslint-disable-line no-alert
    }
  }

  handleTempCodeChange(level, code) {
    const { codes } = this.state;
    codes[12 - level][1] = code;
    this.setState({ codes });
  }

  render() {
    const { codes, channel, unit } = this.state;
    return (
      <Fragment>
        <UnitForm onSubmit={e => e.preventDefault()}>
          <UnitNumberLabel>Unit #:</UnitNumberLabel>
          <UnitNumber type="number" min="0" value={unit} onChange={this.handleUnitNumberChange} />
        </UnitForm>
        <ProgramTitle>Digipot Programming</ProgramTitle>
        <Refresh type="submit" onClick={this.getAllCodes}>
          Refresh Data
        </Refresh>
        <Reconnect type="submit" onClick={this.connect}>
          Reconnect to Digipot
        </Reconnect>
        <br />
        {[1, 2, 3, 4, 5].map(num => (
          <Fragment key={num}>
            <ChannelText>Channel {num}</ChannelText>
            <ChannelRadio type="radio" checked={channel === num} onChange={this.handleChannelSwitch} value={num} />
          </Fragment>
        ))}
        <ApplyDefault type="submit" onClick={this.handleApplyDefaults}>
          Apply Defaults
        </ApplyDefault>
        <SetDefault type="submit" onClick={this.handleSetDefaults}>
          Set Defaults
        </SetDefault>
        {channel
          ? codes.map(([level, code]) => (
              <CodePlot
                key={level}
                level={level}
                code={code}
                channel={channel}
                handleCodeChange={this.handleCodeChange}
                handleTempCodeChange={this.handleTempCodeChange}
              />
            ))
          : null}
      </Fragment>
    );
  }
}
