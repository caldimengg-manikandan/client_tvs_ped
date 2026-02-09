import React from 'react';
import { Steps } from 'antd';
import { CheckCircle, Clock, Settings, Package, Rocket } from 'lucide-react';
import 'antd/dist/reset.css';

const WaterfallStages = ({ stats }) => {
    const stages = [
        {
            title: 'Request',
            count: stats?.requestStage || 0,
            id: 'request',
            description: `${stats?.requestStage || 0} requests`,
            icon: <Package size={20} />
        },
        {
            title: 'Design',
            count: stats?.designStage || 0,
            id: 'design',
            description: `${stats?.designStage || 0} in design`,
            icon: <Settings size={20} />
        },
        {
            title: 'Design Approved',
            count: stats?.designApprovedStage || 0,
            id: 'design_approved',
            description: `${stats?.designApprovedStage || 0} approved`,
            icon: <CheckCircle size={20} />
        },
        {
            title: 'Implementation',
            count: stats?.implementationStage || 0,
            id: 'implementation',
            description: `${stats?.implementationStage || 0} implementing`,
            icon: <Clock size={20} />
        },
        {
            title: 'Production',
            count: stats?.productionStage || 0,
            id: 'production',
            description: `${stats?.productionStage || 0} in production`,
            icon: <Rocket size={20} />
        },
    ];

    // Convert stages to Ant Design Steps format
    const items = stages.map((stage, index) => ({
        title: (
            <div className="flex flex-col items-center">
                <span className="font-semibold text-gray-800">{stage.title}</span>
            </div>
        ),
        description: (
            <div className="text-center mt-2">
                <div className="text-2xl font-bold text-tvs-blue">{stage.count}</div>
                <div className="text-xs text-gray-500 mt-1">{stage.description}</div>
            </div>
        ),
        icon: stage.icon,
        status: stage.count > 0 ? 'process' : 'wait',
    }));

    return (
        <div className="bg-white rounded-lg p-8">
            {/* Ant Design Steps Component */}
            <Steps
                current={-1}
                items={items}
                className="custom-steps"
                size="default"
            />

            {/* Custom Styling for Steps */}
            <style jsx>{`
                :global(.custom-steps .ant-steps-item-icon) {
                    background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
                    border-color: #1677ff;
                }
                
                :global(.custom-steps .ant-steps-item-process .ant-steps-item-icon) {
                    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
                    border-color: #52c41a;
                }
                
                :global(.custom-steps .ant-steps-item-wait .ant-steps-item-icon) {
                    background: #f0f0f0;
                    border-color: #d9d9d9;
                }
                
                :global(.custom-steps .ant-steps-item-finish .ant-steps-item-icon) {
                    background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
                    border-color: #1677ff;
                }
                
                :global(.custom-steps .ant-steps-item-title) {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                }
                
                :global(.custom-steps .ant-steps-item-description) {
                    font-size: 12px !important;
                }
            `}</style>
        </div>
    );
};

export default WaterfallStages;
