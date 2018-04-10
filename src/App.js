import React, { Component } from "react"
import { Collapse, Slider, Row, Col, Layout, Input, Button, Card, Icon, Form, Select } from "antd"

// We import our firestore module
import firestore from "./firestore"

import "./App.css"

// @link https://ant.design/components/form/#components-form-demo-normal-login
const FormItem = Form.Item
const Panel = Collapse.Panel
const Option = Select.Option
const { Header, Footer, Content } = Layout
const { Meta } = Card

const excessStepSize = x => Number.parseFloat(x/100).toFixed(0)
// generate Slider marks from the policy value
function marksMap(x, marks, n) {
    if (!Number.isInteger(x)) {
        return marks
    }
    if (n < 0) {
        return marks
    }
    const y = excessStepSize(x) * n
    marks[y] = `${y} €`
    return marksMap(x, marks, n-2)
}

class App extends Component {
    constructor(props) {
        super(props)
        // Set the default state of our application
        this.state = { addingPolicy: false, policyName: "", policyValue: "", policyType: "", policyExcess: "", policies: [] }
        // We want event handlers to share this context
        this.addPolicy = this.addPolicy.bind(this)
        this.deletePolicy = this.deletePolicy.bind(this)
        // We listen for live changes to our policies collection in Firebase
        firestore.collection("policies").onSnapshot(snapshot => {
            // helper function to simplify the sort
            const tm = doc => new Date(doc.createdAt).getTime()
            // more functional version extracting the firebase docs from the snapshot
            // firebase docs suggests using snapshot.forEach
            // @link https://firebase.google.com/docs/reference/js/firebase.firestore.QuerySnapshot#docs
            const policies = snapshot
                .docs
                .filter(doc => !doc.data().deleted)
                // merge the data and the id,
                // must wrap in parentheses as we're returning an object literal
                .map(doc => (Object.assign({id: doc.id}, doc.data())))
                // Sort our policies based on created time
                .sort((a, b) => tm(a) - tm(b))
            // Anytime the state of our database changes, we update state
            this.setState({ policies })
        })
    }

	componentDidMount() {

	}

    checkPrice = (rule, value, callback) => {
        if (value > 0) {
            callback();
            return;
        }
        callback('Price must greater than zero!');
    }

	async policyTypes(url) {
		const types = await fetch(url)
		return types
	}

    async deletePolicy(id) {
        // Mark the policy as deleted
        await firestore
            .collection("policies")
            .doc(id)
            .set({ deleted: true })
    }

    async addPolicy() {
        if (!this.state.policyName) {
            return
        }
        if (!this.state.policyType) {
            return
        }
        if (!this.state.policyValue) {
            return
        }
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log('Received values of form: ', values)
            }
        })
        // Set a flag to indicate loading
        this.setState({ addingPolicy: true })
        // Add a new policy from the value of the input
        await firestore.collection("policies").add({
            content: this.state.policyName,
            value: this.state.policyValue,
            type: this.state.policyType,
            excess: this.state.policyExcess,
            deleted: false,
            createdAt: new Date().toISOString()
        })
        // Remove the loading flag and clear the input
        this.setState({
			addingPolicy: false,
			policyName: "",
			policyValue: "",
			policyType: "",
			policyExcess: ""
		})
    }

    render() {
        const { getFieldDecorator } = this.props.form
        return (
            <Layout className="App">
                <Header className="App-header">
                    <h1>Mysurance</h1>
                </Header>
                <Content className="App-content">
                    <Row>
                        <Col span={8} offset={8}>
                            <Form>
                                <FormItem label="Policy Name" colon={false}>
                                    {getFieldDecorator("policyName", {
                                        rules: [{
											required: true,
											message: "We need to know what is going to be insured"
										}],
                                    })(
                                    <Input
                                        className="App-add-policy-name"
                                        size="large"
                                        placeholder="What needs coverage?"
                                        disabled={this.state.addingPolicy}
                                        onChange={evt => this.setState({ policyName: evt.target.value })}
                                        onPressEnter={this.addPolicy}
                                    />
                                    )}
                                </FormItem>
								<FormItem label="Policy Type" colon={false}>
									{getFieldDecorator('policyType', {
										rules: [{
											required: true,
											message: 'Please select what kind of policy you need'
										}],
									})(
										<Select
											placeholder="Please select a policy type"
											size="large"
											disabled={this.state.addingPolicy}
											onChange={evt => this.setState({ policyType: evt })}
										>
											<Option value="car">Car</Option>
											<Option value="mobile">Mobile</Option>
										</Select>
									)}
								</FormItem>
                                <FormItem label="Policy Value" colon={false}>
                                    {getFieldDecorator("policyValue", {
                                        rules: [{
											required: true,
											message: "We need the amount for the policy",
											validator: this.checkPrice
										}],
                                    })(
                                    <Input
                                        className="App-add-policy-value"
                                        size="large"
                                        placeholder="How much is it worth?"
                                        disabled={this.state.addingPolicy}
                                        onChange={evt => this.setState({ policyValue: evt.target.value })}
                                        onPressEnter={this.addPolicy}
                                        addonBefore="€"
                                    />
                                    )}
                                </FormItem>
                                <FormItem label="Excess">
                                    {/* must set default of 0 to prevet controlled/uncontrolled warning */}
                                    <input
                                        type="hidden"
                                        value={this.state.policyExcess || 0}
                                        onChange={value => this.setState({ policyExcess: value})}
                                    />
                                    <Slider
                                        marks={marksMap(Number.parseInt(this.state.policyValue, 10), {}, 10)}
                                        max={excessStepSize(this.state.policyValue || 0) * 10}
                                        step={null}
                                        disabled={!this.state.policyValue}
                                        defaultValue={this.state.policyExcess || 0}
                                        onChange={value => this.setState({ policyExcess: value})}
                                        tipFormatter={!this.state.policyValue ? x => 'Please set the policy value' : null}
                                    />
                                </FormItem>
                                <FormItem>
                                    <Button
                                        className="App-add-policy-button"
                                        size="large"
                                        type="primary"
                                        onClick={this.addPolicy}
                                        loading={this.state.addingPolicy}
                                    >
                                        Add Policy
                                    </Button>
                                </FormItem>
                            </Form>
                            {this.state.policies.map(
                                policy => (
                                    <Card
                                        className="App-policy"
                                        key={policy.createdAt}
                                        title={<div><h2>{policy.content}</h2><p>{policy.type || 'Unknown'} insurance</p></div>}
                                        extra={
                                            <Icon
                                                onClick={evt => this.deletePolicy(policy.id)}
                                                className="App-policy-delete"
                                                type="delete"
                                            />
                                        }
                                    >
                                        <h1>{policy.value} € <small>/mo</small></h1>
                                        <Meta
                                            description={
                                                <Collapse bordered={false}>
                                                    <Panel header=" ">
                                                        <p>Excess: {policy.excess || 0} €</p>
                                                        {/*<p>{policy.createdAt}</p>*/}
                                                    </Panel>
                                                </Collapse>
                                            }
                                        />
                                    </Card>
                                )
                            )}
                        </Col>
                    </Row>
                </Content>
                <Footer className="App-footer">&copy; Mysurance</Footer>
            </Layout>
        )
    }
}

const WrappedApp = Form.create()(App)
export default WrappedApp
