# TODO

- [ ] 去掉 guided 等冗余代码
- [ ] 先只保留最常见的 templates
- [ ] 各个页面的title 保持统一
- [x] 选择 Activity Type 自动聚焦搜索
- [ ] refactor ActivityForm 以及 后端的 Data，因为如果用 Blocks 组合的话，title Activity Date 可能无用，换成 createdData 可能更好。 而且为了后续的结构化分析，是否在后端也建立对应的数据结构比较合适，而不是简单的 json。 可以使用物化列
- [x] remove the draft system
- [x] timeline activity list 优化 filter 用不用得到这么多