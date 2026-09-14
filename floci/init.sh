#!/usr/bin/env sh

echo "configuring sns"
echo "==================="
AWS_REGION=eu-west-2


create_topic() {
  local TOPIC_NAME_TO_CREATE=$1
  aws sns create-topic --name ${TOPIC_NAME_TO_CREATE} --region ${AWS_REGION}
}

create_topic "fcp_audit_viewer_publisher_stub"
