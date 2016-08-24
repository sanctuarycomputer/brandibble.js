import _ from 'lodash';

export default class LineItem {
  constructor(product, quantity=1) {
    this.product = product;
    this.quantity = quantity;
    this.configuration = [];
    this.madeFor = null;
    this.instructions = null;
  }

  configurationForGroup(groupOrId) {
    let optionGroupId = (typeof groupOrId === "object") ? groupOrId.id : parseInt(groupOrId);
    return _.find(this.configuration, { optionGroupId });
  }

  addOption(group, item) {
    let groupConfig = this.configurationForGroup(group);
    let canAdd      = group.max_options > (groupConfig ? groupConfigoptionItems.length : 0);

    if (!canAdd) {
      throw {
        error: 'Can not add another option for this group.',
        type: 'option_group',
        subject: group,
        relatedConfiguration: groupConfig
      };
    }

    let match = _.find(this.configuration, { optionGroupId: group.id });
    if (match) {
      match.optionItems.push(item);
    } else {
      this.configuration.push({
        optionGroupId: group.id,
        optionItems: [item]
      });
    }
    return true;
  }

  removeOption(item) {
    let groupConfig = this.configurationForGroup(item.group_id);
    if (groupConfig) {
      groupConfig.optionItems = _.filter(groupConfig.optionItems, oi => oi.id !== item.id);
    }
    return groupConfig;
  }

  isValid() {
    return this.errors().length === 0;
  }

  hasOptionGroups() {
    return this.optionGroups().length > 0;
  }

  optionGroups() {
    return this.product.option_groups || [];
  }

  errors() {
    let optionGroups = this.product.option_groups || [];
    return _(optionGroups).map(group => {
      let match = _.find(this.configuration, { optionGroupId: group.id });
      let count = match ? match.optionItems.length : 0;
      if (count < group.min_options) {
        return {
          error: 'Too Few Options added for this Group.',
          subjectType: 'option_group',
          subject: group,
          relatedConfiguration: this.configurationForGroup(group)
        };
      }
      if (count > group.max_options) {
        return {
          error: 'Too Many Options added for this Group.',
          subjectType: 'option_group',
          subject: group,
          relatedConfiguration: this.configurationForGroup(group)
        };
      }
    }).compact().value();
  }

  format() {
    return {
      id: this.product.id,
      made_for: this.madeFor,
      instructions: this.instructions,
      price: this.product.price,
      quantity: this.quantity,
      option_groups: _.map(this.configuration, g => {
        return {
          id: g.optionGroupId,
          option_items: _.map(g.optionItems, oi => {
            return {
              id: oi.id,
              price: oi.price
            }
          })
        }
      })
    }
  }
}