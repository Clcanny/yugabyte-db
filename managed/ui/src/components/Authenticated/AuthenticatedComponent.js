// Copyright (c) YugaByte, Inc.

import React, { Component } from 'react';
import {withRouter} from 'react-router';
import {isNonEmptyArray} from 'utils/ObjectUtils';
const PropTypes = require('prop-types');

class AuthenticatedComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      prevPath: "",
      fetchScheduled: false,
    };
  }

  getChildContext() {
    return {prevPath: this.state.prevPath};
  }

  componentWillMount() {
    this.props.fetchSoftwareVersions();
    this.props.fetchTableColumnTypes();
    this.props.getEBSListItems();
    this.props.getGCPListItems();
    this.props.getProviderListItems();
    this.props.getSupportedRegionList();
    this.props.getYugaWareVersion();
    this.props.fetchCustomerTasks();
    this.props.fetchCustomerCertificates();
    this.props.fetchCustomerConfigs();
    this.props.fetchInsecureLogin();
  }

  componentWillUnmount() {
    this.props.resetUniverseList();
  }

  hasPendingCustomerTasks = taskList => {
    return isNonEmptyArray(taskList) ? taskList.some((task) => ((task.status === "Running" ||
    task.status === "Initializing") && (Number(task.percentComplete) !== 100))) : false;
  };

  componentWillReceiveProps(nextProps) {
    const { tasks } = nextProps;
    if (this.props.fetchMetadata !== nextProps.fetchMetadata && nextProps.fetchMetadata) {
      this.props.getProviderListItems();
      this.props.fetchUniverseList();
      this.props.getSupportedRegionList();
    }
    if (this.props.fetchUniverseMetadata !== nextProps.fetchUniverseMetadata && nextProps.fetchUniverseMetadata) {
      this.props.fetchUniverseList();
    }
    if (this.props.location !== nextProps.location) {
      this.setState({prevPath: this.props.location.pathname});
    }
    // Check if there are pending customer tasks and no existing recursive fetch calls
    if (this.hasPendingCustomerTasks(tasks.customerTaskList) && !this.state.fetchScheduled) {
      this.scheduleFetch();
    }
  }

  scheduleFetch = () => {
    const self = this;

    function queryTasks() {
      const taskList = self.props.tasks.customerTaskList;

      // Check if there are still customer tasks in progress or if list is empty
      if (!self.hasPendingCustomerTasks(taskList) && isNonEmptyArray(taskList)) {
        self.setState({fetchScheduled: false});
      } else {
        self.props.fetchCustomerTasks().then(() => {
          setTimeout(queryTasks, 6000);
        });
      }
    }
    queryTasks();
    this.setState({fetchScheduled: true});
  };

  render() {
    return (
      <div className="full-height-container">
        {this.props.children}
      </div>
    );
  }
}

export default withRouter(AuthenticatedComponent);

AuthenticatedComponent.childContextTypes = {
  prevPath: PropTypes.string
};
