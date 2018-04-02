import React, { Component } from "react"
import { Row, Col, Layout, Input, Button, Card, Icon, Form } from "antd"

// We import our firestore module
import firestore from "./firestore"

import "./App.css"

// @link https://ant.design/components/form/#components-form-demo-normal-login
const FormItem = Form.Item

const { Header, Footer, Content } = Layout
const { Meta } = Card

class App extends Component {
    constructor(props) {
        super(props)
        // Set the default state of our application
        this.state = { addingPolicy: false, pendingPolicy: "", policies: [] }
        // We want event handlers to share this context
        this.addPolicy = this.addPolicy.bind(this)
        this.deletePolicy = this.deletePolicy.bind(this)
        // We listen for live changes to our policies collection in Firebase
        firestore.collection("policies").onSnapshot(snapshot => {
            // more functional version extracting the firebase docs from the snapshot
            // firebase docs suggests using snapshot.forEach
            // @link https://firebase.google.com/docs/reference/js/firebase.firestore.QuerySnapshot#docs
            // helper function to simplify the sort
            const tm = doc => new Date(doc.createdAt).getTime()
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

    async deletePolicy(id) {
        // Mark the policy as deleted
        await firestore
            .collection("policies")
            .doc(id)
            .set({
                deleted: true
            })
    }

    async addPolicy() {
        if (!this.state.pendingPolicy) return
        // Set a flag to indicate loading
        this.setState({ addingPolicy: true })
        // Add a new policy from the value of the input
        await firestore.collection("policies").add({
            content: this.state.pendingPolicy,
            deleted: false,
            createdAt: new Date().toISOString()
        })
        // Remove the loading flag and clear the input
        this.setState({ addingPolicy: false, pendingPolicy: "" })
    }

    render() {
        return (
            <Layout className="App">
                <Header className="App-header">
                    <h1>Mysurance</h1>
                </Header>
                <Content className="App-content">
                    <Row>
                        <Col span={8} offset={8}>
                            <Form>
                                <FormItem>
                                    <Input
                                        ref="add-policy-input"
                                        className="App-add-policy-input"
                                        size="large"
                                        placeholder="What needs coverage?"
                                        disabled={this.state.addingPolicy}
                                        onChange={evt => this.setState({ pendingPolicy: evt.target.value })}
                                        value={this.state.pendingPolicy}
                                        onPressEnter={this.addPolicy}
                                        required
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
                                        title={policy.content}
                                        actions={[
                                            <Icon
                                                onClick={evt => this.deletePolicy(policy.id)}
                                                className="App-policy-delete"
                                                type="delete"
                                            />
                                        ]}
                                    >
                                        <Meta
                                            description={policy.createdAt}
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

export default App
