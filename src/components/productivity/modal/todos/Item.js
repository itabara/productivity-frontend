'use strict';

import React, { Component } from 'react';
import { Checkbox, Input, Button, Spin, message, Modal } from 'antd';

import { graphql } from 'react-apollo';
import UpdateTodoMutation from 'app/graphql/mutations/cards/UpdateTodo';
import DeleteTodoMutation from 'app/graphql/mutations/cards/DeleteTodo';
import update from 'immutability-helper';


class TodoItem extends Component {

	constructor(props) {
		super(props);
		this.state = {
			edit: false,
			processing: false,
			processing_status: false,
		}
		this.edit = this.edit.bind(this);
		this.hide = this.hide.bind(this);
		this.updateField = this.updateField.bind(this);
		this.update = this.update.bind(this);
		this.updateStatus = this.updateStatus.bind(this);

		this.confirmDelete = this.confirmDelete.bind(this);
		this.delete = this.delete.bind(this);
	}


	edit() {
		this.setState({ edit: true });
	}
	hide() {
		this.setState({ edit: false, title: null, description: null });
	}

	updateField(event, field) {
		this.setState({ [field]: event.target.value })
	}



	update() {
		if ( ! this.state.title && ! this.state.description ) {
			return message.warning('Please make changes to the item first.');
		}

		this.setState({ processing: true });
		const loading_message = message.loading('Updating todo item..', 0);

		this.props.mutate({
			variables: {
				_card: this.props.card.id,
				_id: this.props.data._id,
				title: this.state.title || this.props.data.title,
				description: this.state.description || this.props.data.description,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				updateTodo: {
					__typename: 'Todo',
					_card: this.props.card.id,
					_id: this.props.data._id,
					title: this.state.title || this.props.data.title,
					description: this.state.description || this.props.data.description,
				},
			},
			updateQueries: {
				BoardQuery: (previousResult, { mutationResult }) => {
					const updatedTodo = mutationResult.data.updateTodo;
					// console.log('previousResult',previousResult);
					const listIndex = _.findIndex( previousResult.board.lists, { id: this.props.card._list } );
					const cardIndex = _.findIndex( previousResult.board.lists[listIndex].cards, { id: this.props.card.id } );
					const todoIndex = _.findIndex( previousResult.board.lists[listIndex].cards[cardIndex].todos, { _id: this.props.data._id } );

					// console.log('listIndex',listIndex, ' cardIndex', cardIndex, ' todoIndex',todoIndex );
					const updated = update(previousResult, {
						board: {
							lists: {
								[listIndex]: {
									cards: {
										[cardIndex]: {
											todos: {
												$splice: [[ todoIndex, 1, updatedTodo]]
											}
										}
									}
								}
							}
						},
					});
					return updated;
				}
			},
		})
		.then( res => {
			loading_message();
			this.setState({ processing: false, edit: false, title: null, description: null });
			message.success('Todo item has been successfully updated.');
		})
		.catch( res => {
			if ( res.graphQLErrors ) {
				const errors = res.graphQLErrors.map( error => error.message );
				this.setState({ processing: false });
			}
		});

	}




	confirmDelete() {
		const deleteItem = this.delete;
		Modal.confirm({
			title: 'Are you sure?',
			content: 'This is a non reversible process, Once deleted you cannot recover this todo item again.',
			okText: 'Yes',
			cancelText: 'No',
			onOk() {
				deleteItem();
			},
			onCancel() {},
		});
	}







	delete() {
		this.setState({ processing: true });
		const loading_message = message.loading('Deleting todo item..', 0);

		this.props.deleteTodo({
			variables: {
				_card: this.props.card.id,
				_id: this.props.data._id,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				deleteTodo: {
					__typename: 'Todo',
					_id: this.props.data._id,
				},
			},
			updateQueries: {
				BoardQuery: (previousResult, { mutationResult }) => {
					const listIndex = _.findIndex( previousResult.board.lists, { id: this.props.card._list } );
					const cardIndex = _.findIndex( previousResult.board.lists[listIndex].cards, { id: this.props.card.id } );
					const todoIndex = _.findIndex( previousResult.board.lists[listIndex].cards[cardIndex].todos, { _id: this.props.data._id } );

					const updated = update(previousResult, {
						board: {
							lists: {
								[listIndex]: {
									cards: {
										[cardIndex]: {
											todos: {
												$splice: [[ todoIndex, 1 ]]
											}
										}
									}
								}
							}
						},
					});
					return updated;
				}
			},
		})
		.then( res => {
			loading_message();
			message.success('Todo item has been successfully deleted.');
		})
		.catch( res => {
			if ( res.graphQLErrors ) {
				const errors = res.graphQLErrors.map( error => error.message );
				this.setState({ processing: false });
			}
		});


	}









	updateStatus( event ) {
		this.setState({ processing_status: true });
		const loading_message = message.loading('Updating todo status..', 0);

		this.props.mutate({
			variables: {
				_card: this.props.card.id,
				_id: this.props.data._id,
				completed: event.target.checked,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				updateTodo: {
					__typename: 'Todo',
					_card: this.props.card.id,
					_id: this.props.data._id,
					completed: event.target.checked,
					title: this.props.data.title,
					description: this.props.data.description,
				},
			},
			updateQueries: {
				BoardQuery: (previousResult, { mutationResult }) => {
					const updatedTodo = mutationResult.data.updateTodo;
					const listIndex = _.findIndex( previousResult.board.lists, { id: this.props.card._list } );
					const cardIndex = _.findIndex( previousResult.board.lists[listIndex].cards, { id: this.props.card.id } );
					const todoIndex = _.findIndex( previousResult.board.lists[listIndex].cards[cardIndex].todos, { _id: this.props.data._id } );
					const updated = update(previousResult, {
						board: {
							lists: {
								[listIndex]: {
									cards: {
										[cardIndex]: {
											todos: {
												$splice: [[ todoIndex, 1, updatedTodo]]
											}
										}
									}
								}
							}
						},
					});
					return updated;
				}
			},
		})
		.then( res => {
			loading_message();
			this.setState({ processing_status: false });
			message.success('Todo item status has been successfully updated.');
		})
		.catch( res => {
			if ( res.graphQLErrors ) {
				const errors = res.graphQLErrors.map( error => error.message );
			}
		});

	}





	render() {

		const showPublicTodo = (data) => {
			return(
				<div className="item">
					<div className="status">
						<Checkbox defaultChecked={ data.completed } disabled />
					</div>
					<div className="info">
						<div className="title">{ data.title }</div>
						{ data.description &&
							<div className="description">{ data.description }</div>
						}
					</div>
				</div>
			);
		}



		const showNormalTodo = (data) => {
			return(
				<Spin spinning={ data._id === 'loading' } tip="Adding item.." size="large">
				<div className="item">
					<div className="status">
						<Spin spinning={ this.state.processing_status } size="small">
							<Checkbox defaultChecked={ data.completed } onChange={ this.updateStatus } />
						</Spin>
					</div>
					<div className="info" onClick={ this.edit }>
						<div className="title">{ data.title }</div>
						{ data.description &&
							<div className="description">{ data.description }</div>
						}
					</div>
				</div>
				</Spin>
			);
		}


		const showEditableTodo = (data) => {
			return(
				<Spin spinning={ this.state.processing } tip="Updating item.." size="large">
				<div className="item">
					<div className="status">
						<Spin spinning={ this.state.processing_status } size="small">
							<Checkbox defaultChecked={ data.completed } onChange={ this.updateStatus } />
						</Spin>
					</div>
					<div className="component__todo_list edit">
						<div>
							<Input
								placeholder="Todo Title"
								autoFocus={true}
								onChange={ (event) => { this.updateField(event, 'title' ) } }
								defaultValue={ data.title }
							/>
							<Input
								type="textarea"
								placeholder="Please enter todo description here"
								autosize={{ minRows: 3, maxRows: 5 }}
								className="m-t-5"
								onChange={ (event) => { this.updateField(event, 'description' ) } }
								defaultValue={ data.description }
							/>
						</div>
						<div className="m-t-10">
							<Button type="primary" onClick={ this.update }>Update Todo</Button>
							<Button type="ghost" className="m-l-5" onClick={ this.hide }>Cancel</Button>
							<Button type="danger" className="float-right" onClick={ this.confirmDelete }>Delete Todo</Button>
						</div>
					</div>
				</div>
				</Spin>
			);
		}

		const { data } = this.props;

		if ( this.props.public ) {
			return showPublicTodo(data);
		}

		else if ( ! this.state.edit ) {
			return showNormalTodo(data);
		}
		else {
			return showEditableTodo(data);
		}


	}

}

export default graphql(UpdateTodoMutation)(
	graphql(DeleteTodoMutation, { name: 'deleteTodo' })(TodoItem)
);
