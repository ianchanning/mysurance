import React, { Component } from "react"
import { Layout, Input, Button, List, Icon } from "antd"

// We import our firestore module
import firestore from "./firestore"

import "./App.css"

const { Header, Footer, Content } = Layout

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
            let policies = []
            snapshot.forEach(doc => {
                const policy = doc.data()
                policy.id = doc.id
                if (!policy.deleted) policies.push(policy)
            })
            // Sort our policies based on time added
            policies.sort(function(a, b) {
                return (
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )
            })
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
                    <Button
                        className="App-add-policy-button"
                        size="large"
                        type="primary"
                        onClick={this.addPolicy}
                        loading={this.state.addingPolicy}
                    >
                        Add Policy
                    </Button>
                    <List
                        className="App-policies"
                        size="large"
                        bordered
                        dataSource={this.state.policies}
                        renderItem={policy => (
                            <List.Item>
                                {policy.content}
                                <Icon
                                    onClick={evt => this.deletePolicy(policy.id)}
                                    className="App-policy-delete"
                                    type="delete"
                                />
                            </List.Item>
                        )}
                    />
                </Content>
                <Footer className="App-footer">&copy; Mysurance</Footer>
            </Layout>
        )
    }
}

export default App
